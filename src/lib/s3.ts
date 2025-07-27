import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'inteliexamen-sources';

export interface S3UploadResult {
  success: boolean;
  s3Key?: string;
  error?: string;
  url?: string;
}

export interface S3FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
}

/**
 * Upload a file to S3
 */
export async function uploadFileToS3(
  file: Buffer,
  key: string,
  contentType: string = 'application/pdf'
): Promise<S3UploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    return {
      success: true,
      s3Key: key,
      url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown S3 error',
    };
  }
}

/**
 * Generate a presigned URL for file download
 */
export async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return null;
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
}

/**
 * Generate a unique S3 key for a PDF file
 */
export function generateS3Key(fileName: string, sourceId?: number): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const prefix = sourceId ? `sources/${sourceId}` : `sources/temp`;
  return `${prefix}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Validate S3 configuration
 */
export function validateS3Config(): boolean {
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing S3 environment variables:', missingVars);
    return false;
  }

  return true;
} 