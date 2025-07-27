-- Create assessment-sources relationship table
-- This table links assessments directly to their sources for AI feedback

CREATE TABLE `inteli_assessments_sources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `source_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_assessment_source` (`assessment_id`,`source_id`),
  KEY `assessment_id` (`assessment_id`),
  KEY `source_id` (`source_id`),
  CONSTRAINT `inteli_assessments_sources_ibfk_1` FOREIGN KEY (`assessment_id`) REFERENCES `inteli_assessments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inteli_assessments_sources_ibfk_2` FOREIGN KEY (`source_id`) REFERENCES `inteli_sources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Add indexes for better performance
CREATE INDEX `idx_assessments_sources_assessment` ON `inteli_assessments_sources` (`assessment_id`);
CREATE INDEX `idx_assessments_sources_source` ON `inteli_assessments_sources` (`source_id`); 