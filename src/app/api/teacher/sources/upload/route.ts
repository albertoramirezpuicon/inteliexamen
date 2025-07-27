import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';
import { uploadFileToS3, generateS3Key } from '@/lib/s3';
import { extractPDFText } from '@/lib/pdfProcessor';
import { processPDFForEmbeddings } from '@/lib/embeddings';

// POST - Upload PDF and create new source
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

    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const authors = formData.get('authors') as string;
    const publication_year = formData.get('publication_year') as string;
    const pdf_file = formData.get('pdf_file') as File;
    
    if (!title || !pdf_file) {
      return NextResponse.json(
        { error: 'Title and PDF file are required.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (pdf_file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 128MB)
    const maxSize = 128 * 1024 * 1024; // 128MB
    if (pdf_file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 128MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await pdf_file.arrayBuffer());
    
    // First, create the database record to get the source ID
    const result = await insertQuery(
      `INSERT INTO inteli_sources (
        title, 
        authors, 
        publication_year, 
        pdf_s3_key, 
        pdf_processing_status, 
        pdf_upload_date, 
        pdf_file_size, 
        is_custom, 
        created_by
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?, TRUE, ?)`,
      [
        title.trim(), 
        authors?.trim() || null, 
        publication_year ? parseInt(publication_year) : null, 
        null, // Will be updated after S3 upload
        'processing', 
        pdf_file.size, 
        userId // Set the actual user ID
      ]
    );

    const sourceId = result.insertId;
    
    // Generate S3 key with source ID for better organization
    const s3Key = generateS3Key(pdf_file.name, sourceId);
    
    // Upload to S3 with the proper source ID
    const uploadResult = await uploadFileToS3(fileBuffer, s3Key, pdf_file.type);
    
    if (!uploadResult.success) {
      // If S3 upload fails, delete the database record
      await query('DELETE FROM inteli_sources WHERE id = ?', [sourceId]);
      return NextResponse.json(
        { error: `Failed to upload to S3: ${uploadResult.error}` },
        { status: 500 }
      );
    }
    
    // Update the database record with the S3 key
    await query(
      'UPDATE inteli_sources SET pdf_s3_key = ? WHERE id = ?',
      [uploadResult.s3Key, sourceId]
    );

    // Process PDF content and generate embeddings
    try {
      // Extract text from PDF
      const pdfResult = await extractPDFText(fileBuffer);
      
      if (!pdfResult.success) {
        console.error('PDF processing failed:', pdfResult.error);
        // Update status to failed
        await query(
          `UPDATE inteli_sources SET pdf_processing_status = 'failed' WHERE id = ?`,
          [sourceId]
        );
        
        // Note: We keep the S3 file even if processing fails, as the user might want to retry
        return NextResponse.json(
          { error: `PDF processing failed: ${pdfResult.error}` },
          { status: 500 }
        );
      }

      // Generate embeddings
      const embeddingResult = await processPDFForEmbeddings(pdfResult.content!, sourceId);
      
      if (!embeddingResult.success) {
        // Update status to failed
        await query(
          `UPDATE inteli_sources SET pdf_processing_status = 'failed' WHERE id = ?`,
          [sourceId]
        );
        
        // Note: We keep the S3 file even if embedding generation fails
        return NextResponse.json(
          { error: `Embedding generation failed: ${embeddingResult.error}` },
          { status: 500 }
        );
      }

      // Store embeddings in database
      await query(
        `UPDATE inteli_sources SET 
          pdf_content_embeddings = ?, 
          pdf_processing_status = 'completed' 
         WHERE id = ?`,
        [JSON.stringify(embeddingResult.chunks), sourceId]
      );

    } catch (error) {
      console.error('Error processing PDF:', error);
      
      // Update status to failed
      await query(
        `UPDATE inteli_sources SET pdf_processing_status = 'failed' WHERE id = ?`,
        [sourceId]
      );
      
      return NextResponse.json(
        { error: 'PDF processing failed' },
        { status: 500 }
      );
    }

    // Return the created source
    const [source] = await query(
      `SELECT * FROM inteli_sources WHERE id = ?`,
      [sourceId]
    );

    return NextResponse.json({ 
      source, 
      s3_key: uploadResult.s3Key,
      message: 'Source uploaded and processed successfully!' 
    });
  } catch (error) {
    console.error('Error uploading source:', error);
    return NextResponse.json(
      { error: 'Failed to upload source' },
      { status: 500 }
    );
  }
} 