import OpenAI from 'openai';
import { PDFContent, PDFSection } from './pdfProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    sourceId: number;
    page: number;
    sectionType: string;
    chunkIndex: number;
    title?: string;
    author?: string;
  };
}

export interface EmbeddingResult {
  success: boolean;
  chunks?: EmbeddingChunk[];
  error?: string;
  totalChunks?: number;
}

/**
 * Split text into chunks suitable for embedding
 */
export function splitTextIntoChunks(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const sentenceWithPunctuation = sentence.trim() + '.';
    
    if (currentChunk.length + sentenceWithPunctuation.length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentenceWithPunctuation;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  // Add overlapping chunks for better context
  const overlappingChunks: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    overlappingChunks.push(chunk);
    
    // Add overlap with next chunk if it exists
    if (i < chunks.length - 1 && overlap > 0) {
      const nextChunk = chunks[i + 1];
      const overlapText = chunk.slice(-overlap);
      const overlapChunk = overlapText + ' ' + nextChunk;
      overlappingChunks.push(overlapChunk);
    }
  }
  
  return overlappingChunks;
}

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(textChunks: string[]): Promise<number[][]> {
  try {
    const embeddings: number[][] = [];
    
    // Process chunks in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < textChunks.length; i += batchSize) {
      const batch = textChunks.slice(i, i + batchSize);
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });
      
      const batchEmbeddings = response.data.map(item => item.embedding);
      embeddings.push(...batchEmbeddings);
      
      // Add small delay between batches to respect rate limits
      if (i + batchSize < textChunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Process PDF content and generate embeddings
 */
export async function processPDFForEmbeddings(
  pdfContent: PDFContent,
  sourceId: number
): Promise<EmbeddingResult> {
  try {
    const chunks: EmbeddingChunk[] = [];
    
    // Process each section of the PDF
    for (let sectionIndex = 0; sectionIndex < pdfContent.sections.length; sectionIndex++) {
      const section = pdfContent.sections[sectionIndex];
      const textChunks = splitTextIntoChunks(section.content);
      
      // Generate embeddings for this section's chunks
      const embeddings = await generateEmbeddings(textChunks);
      
      // Create embedding chunks with metadata
      for (let chunkIndex = 0; chunkIndex < textChunks.length; chunkIndex++) {
        const chunk: EmbeddingChunk = {
          id: `${sourceId}_${section.page}_${sectionIndex}_${chunkIndex}`,
          content: textChunks[chunkIndex],
          embedding: embeddings[chunkIndex],
          metadata: {
            sourceId,
            page: section.page,
            sectionType: section.type,
            chunkIndex,
            title: pdfContent.metadata.title,
            author: pdfContent.metadata.author,
          },
        };
        
        chunks.push(chunk);
      }
    }
    
    return {
      success: true,
      chunks,
      totalChunks: chunks.length,
    };
  } catch (error) {
    console.error('Error processing PDF for embeddings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown embedding error',
    };
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
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

/**
 * Find most similar chunks to a query
 */
export function findSimilarChunks(
  queryEmbedding: number[],
  chunks: EmbeddingChunk[],
  topK: number = 5
): EmbeddingChunk[] {
  const similarities = chunks.map(chunk => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(item => item.chunk);
}

/**
 * Generate embedding for a query text
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw new Error('Failed to generate query embedding');
  }
} 