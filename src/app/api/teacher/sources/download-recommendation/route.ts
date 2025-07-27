import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';
import { uploadFileToS3 } from '@/lib/s3';
import { processPdfContent } from '@/lib/pdfProcessor';

interface SourceRecommendation {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url: string;
  source_type: 'article' | 'book' | 'chapter';
  journal?: string;
  publisher?: string;
  doi?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from session or token
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('user-id')?.value ||
                   '1'; // Fallback for development

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { skillId, recommendation } = await request.json();

    if (!skillId || !recommendation) {
      return NextResponse.json(
        { error: 'Skill ID and recommendation are required' },
        { status: 400 }
      );
    }

    // Create the source record first to get the ID
    const result = await insertQuery(
      `INSERT INTO inteli_sources (
        title, 
        authors, 
        publication_year, 
        created_by, 
        pdf_processing_status,
        is_custom
      ) VALUES (?, ?, ?, ?, 'completed', TRUE)`,
      [
        recommendation.title,
        recommendation.authors.join(', '),
        recommendation.year,
        userId
      ]
    );

    const sourceId = result.insertId;

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Failed to create source record' },
        { status: 500 }
      );
    }

    try {
      // Try to download the PDF from the URL
      let pdfBuffer: Buffer | null = null;
      let fileName = `${recommendation.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      try {
        console.log('Attempting to download PDF from:', recommendation.url);
        const response = await fetch(recommendation.url);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          console.log('Response content-type:', contentType);
          
          if (contentType && contentType.includes('application/pdf')) {
            pdfBuffer = Buffer.from(await response.arrayBuffer());
            console.log('Successfully downloaded PDF, size:', pdfBuffer.length);
          } else if (contentType && contentType.includes('text/html')) {
            console.log('URL returned HTML instead of PDF. This indicates the URL is not a direct PDF link.');
          } else {
            console.log('Unexpected content type:', contentType);
          }
        } else {
          console.log('Failed to fetch URL, status:', response.status);
        }
      } catch (downloadError) {
        console.log('Failed to download PDF from URL:', downloadError);
      }

      // If we couldn't download the PDF, create a placeholder PDF with the source information
      if (!pdfBuffer) {
        // Create a simple PDF-like content with the source information
        const pdfContent = `
================================================================================
                           RECOMMENDED SOURCE PLACEHOLDER
================================================================================

Title: ${recommendation.title}
Authors: ${recommendation.authors.join(', ')}
Year: ${recommendation.year}
Type: ${recommendation.source_type}
${recommendation.journal ? `Journal: ${recommendation.journal}` : ''}
${recommendation.publisher ? `Publisher: ${recommendation.publisher}` : ''}
${recommendation.doi ? `DOI: ${recommendation.doi}` : ''}

================================================================================
                                ABSTRACT
================================================================================

${recommendation.abstract}

================================================================================
                              SOURCE INFORMATION
================================================================================

Source URL: ${recommendation.url}

This is a placeholder document for the recommended source. The actual PDF could 
not be downloaded automatically from the provided URL. Please visit the source 
URL to access the full document.

Note: This placeholder contains the source metadata and abstract, but not the 
full content of the original document.
        `;
        
        pdfBuffer = Buffer.from(pdfContent, 'utf-8');
        fileName = `${recommendation.title.replace(/[^a-zA-Z0-9]/g, '_')}_placeholder.pdf`;
      }

      // Upload to S3 with the proper folder structure
      const s3Key = `sources/${sourceId}/${fileName}`;
      const contentType = fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain';
      const uploadResult = await uploadFileToS3(pdfBuffer, s3Key, contentType);

      if (!uploadResult.success) {
        throw new Error('Failed to upload to S3');
      }

      // Process the PDF content for embeddings
      let processedContent = '';
      try {
        if (fileName.endsWith('.pdf')) {
          processedContent = await processPdfContent(pdfBuffer);
        } else {
          // For placeholder text files, use the content directly
          processedContent = pdfBuffer.toString('utf-8');
        }
      } catch (processError) {
        console.error('Error processing PDF content:', processError);
        processedContent = recommendation.abstract || 'Content processing failed';
      }

      // Update the source record with S3 key and processed content
      await query(
        `UPDATE inteli_sources SET 
          pdf_s3_key = ?, 
          pdf_file_size = ?, 
          pdf_content_embeddings = ? 
         WHERE id = ?`,
        [s3Key, pdfBuffer.length, JSON.stringify({ content: processedContent }), sourceId]
      );

      // Link the source to the skill
      await insertQuery(
        `INSERT IGNORE INTO inteli_skills_sources (skill_id, source_id) VALUES (?, ?)`,
        [skillId, sourceId]
      );

      // Get the created source
      const [newSource] = await query(
        `SELECT * FROM inteli_sources WHERE id = ?`,
        [sourceId]
      );

      return NextResponse.json({
        success: true,
        source: {
          id: newSource.id,
          title: newSource.title,
          authors: newSource.authors,
          year: newSource.publication_year,
          s3_key: s3Key,
          file_size: pdfBuffer.length
        }
      });

    } catch (error) {
      // If anything fails after creating the record, delete it
      await query('DELETE FROM inteli_sources WHERE id = ?', [sourceId]);
      throw error;
    }

  } catch (error) {
    console.error('Error downloading and processing recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to download and process source' },
      { status: 500 }
    );
  }
} 