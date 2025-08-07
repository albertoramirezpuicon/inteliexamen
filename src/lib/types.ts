// Global Type Definitions for Inteliexamen

// Updated Source interface for simplified PDF-based RAG approach
export interface Source {
  id: number;
  title: string;
  authors?: string;
  publication_year?: number;
  pdf_s3_key?: string;
  pdf_content_embeddings?: any; // JSON field for embeddings
  pdf_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  pdf_upload_date?: string;
  pdf_file_size?: number;
  is_custom: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

// Legacy Source interface (for backward compatibility during migration)
export interface LegacySource {
  id: number;
  title: string;
  authors?: string;
  publication_year?: number;
  source_type: string;
  url?: string;
  doi?: string;
  description?: string;
  is_custom: boolean;
  created_at: string;
  is_selected?: boolean;
}

// Source creation/update payload
export interface CreateSourcePayload {
  title: string;
  authors?: string;
  publication_year?: number;
  pdf_file?: File;
}

// Source upload response
export interface SourceUploadResponse {
  source: Source;
  message: string;
  s3_key?: string;
}

// PDF processing status
export interface PDFProcessingStatus {
  source_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error_message?: string;
}

// Skill interface (if not already defined elsewhere)
export interface Skill {
  id: number;
  name: string;
  description?: string;
  domain_id: number;
  domain_name?: string;
  sources_count?: number;
}

// Domain interface (if not already defined elsewhere)
export interface Domain {
  id: number;
  name: string;
  description?: string;
  skills_count?: number;
}

// Skill Level interface
export interface SkillLevel {
  id: number;
  skill_id: number;
  skill_level_setting_id: number;
  order: number;
  label: string;
  standard: number;
  description: string;
}

// Skill Level Setting interface (institution template)
export interface SkillLevelSetting {
  id: number;
  institution_id: number;
  order: number;
  label: string;
  description: string;
  lower_limit?: number;
  upper_limit?: number;
} 