import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      );
    }

    console.log('Generating presigned URL for key:', key);

    // Generate a presigned URL for the PDF file
    const presignedUrl = await generatePresignedUrl(key, 3600); // 1 hour expiry

    if (!presignedUrl) {
      console.error('Failed to generate presigned URL for key:', key);
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    console.log('Generated presigned URL successfully');

    return NextResponse.json({
      url: presignedUrl
    });

  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
} 