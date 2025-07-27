import { query } from './db';
import { extractPDFText } from './pdfProcessor';
import { processPDFForEmbeddings } from './embeddings';
import { generatePresignedUrl } from './s3';

export interface ProcessingJob {
  id: string;
  sourceId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// In-memory job queue (in production, use Redis or a proper job queue)
const jobQueue: Map<string, ProcessingJob> = new Map();

/**
 * Add a PDF processing job to the queue
 */
export function addProcessingJob(sourceId: number): string {
  const jobId = `pdf_processing_${sourceId}_${Date.now()}`;
  
  const job: ProcessingJob = {
    id: jobId,
    sourceId,
    status: 'pending',
    progress: 0,
  };
  
  jobQueue.set(jobId, job);
  
  // Start processing immediately (in production, this would be handled by a worker)
  processJob(jobId);
  
  return jobId;
}

/**
 * Process a PDF job
 */
async function processJob(jobId: string) {
  const job = jobQueue.get(jobId);
  if (!job) return;
  
  try {
    // Update status to processing
    job.status = 'processing';
    job.startedAt = new Date();
    job.progress = 10;
    
    // Update database status
    await query(
      `UPDATE inteli_sources SET pdf_processing_status = 'processing' WHERE id = ?`,
      [job.sourceId]
    );
    
    // Get source information
    const [source] = await query(
      `SELECT pdf_s3_key FROM inteli_sources WHERE id = ?`,
      [job.sourceId]
    );
    
    if (!source || !source.pdf_s3_key) {
      throw new Error('Source not found or no S3 key available');
    }
    
    job.progress = 20;
    
    // Download PDF from S3 (simplified - in production, use proper S3 download)
    // For now, we'll simulate this step
    const pdfBuffer = await downloadPDFFromS3(source.pdf_s3_key);
    
    job.progress = 40;
    
    // Extract text from PDF
    const pdfResult = await extractPDFText(pdfBuffer);
    
    if (!pdfResult.success) {
      throw new Error(`PDF processing failed: ${pdfResult.error}`);
    }
    
    job.progress = 60;
    
    // Generate embeddings
    const embeddingResult = await processPDFForEmbeddings(pdfResult.content!, job.sourceId);
    
    if (!embeddingResult.success) {
      throw new Error(`Embedding generation failed: ${embeddingResult.error}`);
    }
    
    job.progress = 80;
    
    // Store embeddings in database
    await query(
      `UPDATE inteli_sources SET 
        pdf_content_embeddings = ?, 
        pdf_processing_status = 'completed' 
       WHERE id = ?`,
      [JSON.stringify(embeddingResult.chunks), job.sourceId]
    );
    
    // Update job status
    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();
    
    // Update database status
    await query(
      `UPDATE inteli_sources SET pdf_processing_status = 'failed' WHERE id = ?`,
      [job.sourceId]
    );
  }
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): ProcessingJob | null {
  return jobQueue.get(jobId) || null;
}

/**
 * Get all jobs for a source
 */
export function getJobsForSource(sourceId: number): ProcessingJob[] {
  return Array.from(jobQueue.values()).filter(job => job.sourceId === sourceId);
}

/**
 * Clean up completed jobs (older than 1 hour)
 */
export function cleanupOldJobs() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  for (const [jobId, job] of jobQueue.entries()) {
    if (job.completedAt && job.completedAt < oneHourAgo) {
      jobQueue.delete(jobId);
    }
  }
}

/**
 * Simulate downloading PDF from S3
 * In production, this would use the AWS SDK to download the file
 */
async function downloadPDFFromS3(s3Key: string): Promise<Buffer> {
  // This is a placeholder - in production, you would:
  // 1. Use AWS SDK to download the file from S3
  // 2. Return the actual PDF buffer
  
  // For now, return a dummy buffer
  return Buffer.from('dummy pdf content');
}

// Clean up old jobs every hour
setInterval(cleanupOldJobs, 60 * 60 * 1000); 