import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateQueryEmbedding, findSimilarChunks, EmbeddingChunk } from '@/lib/embeddings';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RAGFeedbackRequest {
  studentResponse: string;
  skillId: number;
  question: string;
  context?: string;
}

export interface RAGFeedbackResponse {
  feedback: string;
  sources: Array<{
    title: string;
    author?: string;
    content: string;
    page: number;
    relevance: number;
  }>;
  confidence: number;
}

// POST - Generate RAG-enhanced feedback
export async function POST(request: NextRequest) {
  try {
    const { studentResponse, skillId, question, context }: RAGFeedbackRequest = await request.json();
    
    if (!studentResponse || !skillId || !question) {
      return NextResponse.json(
        { error: 'Student response, skill ID, and question are required.' },
        { status: 400 }
      );
    }

    // Get sources for this skill
    const sources = await query(
      `SELECT 
        s.id,
        s.title,
        s.authors,
        s.pdf_content_embeddings,
        s.pdf_processing_status
      FROM inteli_sources s
      INNER JOIN inteli_skills_sources ss ON s.id = ss.source_id
      WHERE ss.skill_id = ? AND s.pdf_processing_status = 'completed'
      ORDER BY s.created_at DESC`,
      [skillId]
    );

    if (sources.length === 0) {
      return NextResponse.json(
        { error: 'No processed sources found for this skill.' },
        { status: 404 }
      );
    }

    // Generate embedding for the student response
    const queryEmbedding = await generateQueryEmbedding(studentResponse);
    
    // Find relevant content from all sources
    const relevantChunks: Array<EmbeddingChunk & { sourceTitle: string; sourceAuthor?: string }> = [];
    
    for (const source of sources) {
      if (source.pdf_content_embeddings) {
        const chunks: EmbeddingChunk[] = JSON.parse(source.pdf_content_embeddings);
        
        // Find most similar chunks from this source
        const similarChunks = findSimilarChunks(queryEmbedding, chunks, 3);
        
        similarChunks.forEach(chunk => {
          relevantChunks.push({
            ...chunk,
            sourceTitle: source.title,
            sourceAuthor: source.authors,
          });
        });
      }
    }

    // Sort by relevance (similarity score)
    relevantChunks.sort((a, b) => {
      const similarityA = cosineSimilarity(queryEmbedding, a.embedding);
      const similarityB = cosineSimilarity(queryEmbedding, b.embedding);
      return similarityB - similarityA;
    });

    // Take top 5 most relevant chunks
    const topChunks = relevantChunks.slice(0, 5);

    if (topChunks.length === 0) {
      return NextResponse.json(
        { error: 'No relevant content found in sources.' },
        { status: 404 }
      );
    }

    // Prepare context for AI
    const sourceContext = topChunks.map((chunk, index) => 
      `Source ${index + 1}: "${chunk.sourceTitle}" by ${chunk.sourceAuthor || 'Unknown Author'} (Page ${chunk.metadata.page})
Content: ${chunk.content}`
    ).join('\n\n');

    // Generate AI feedback using RAG
    const prompt = `You are an expert educational assessor. Based on the provided source materials, evaluate the student's response and provide constructive feedback.

Question: ${question}
${context ? `Context: ${context}\n` : ''}
Student Response: ${studentResponse}

Relevant Source Materials:
${sourceContext}

Instructions:
1. Analyze the student's response against the source materials
2. Provide specific, constructive feedback that references the sources
3. Identify areas of strength and areas for improvement
4. Suggest specific ways to enhance the response based on the source content
5. Use a supportive, encouraging tone
6. Keep feedback concise but comprehensive (200-300 words)

Feedback:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assessor who provides constructive, source-based feedback to students.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const feedback = completion.choices[0]?.message?.content || 'Unable to generate feedback.';

    // Prepare response with source information
    const response: RAGFeedbackResponse = {
      feedback,
      sources: topChunks.map((chunk, index) => ({
        title: chunk.sourceTitle,
        author: chunk.sourceAuthor,
        content: chunk.content.substring(0, 200) + '...',
        page: chunk.metadata.page,
        relevance: Math.round(cosineSimilarity(queryEmbedding, chunk.embedding) * 100),
      })),
      confidence: Math.round(
        topChunks.reduce((sum, chunk) => sum + cosineSimilarity(queryEmbedding, chunk.embedding), 0) / topChunks.length * 100
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating RAG feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
} 