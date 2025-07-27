import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { deleteFileFromS3 } from '@/lib/s3';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sourceId = parseInt(id);
    
    if (!sourceId || isNaN(sourceId)) {
      return NextResponse.json(
        { error: 'Invalid source ID' },
        { status: 400 }
      );
    }

    // Get the source to find the S3 key
    const [source] = await query(
      'SELECT pdf_s3_key FROM inteli_sources WHERE id = ?',
      [sourceId]
    );

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    // Delete from S3 if there's a file
    if (source.pdf_s3_key) {
      try {
        await deleteFileFromS3(source.pdf_s3_key);
        console.log('Deleted file from S3:', source.pdf_s3_key);
      } catch (s3Error) {
        console.error('Error deleting from S3:', s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete from inteli_skills_sources (links to skills)
    await query(
      'DELETE FROM inteli_skills_sources WHERE source_id = ?',
      [sourceId]
    );

    // Delete from inteli_sources
    const result = await query(
      'DELETE FROM inteli_sources WHERE id = ?',
      [sourceId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Source deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
} 