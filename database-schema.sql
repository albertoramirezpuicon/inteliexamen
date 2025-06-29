-- Database Schema for Inteliexamen Project
-- Paste your SHOW CREATE TABLE results below this line
-- =====================================================

-- Example of what to paste:
-- CREATE TABLE `inteli_assessments` (
--   `id` int NOT NULL AUTO_INCREMENT,
--   `name` varchar(255) NOT NULL,
--   `description` text,
--   `difficulty_level` varchar(50),
--   `educational_level` varchar(100),
--   `evaluation_context` text,
--   `available_from` datetime,
--   `available_until` datetime,
--   `dispute_period` int,
--   `status` varchar(50),
--   `institution_id` int,
--   `teacher_id` int,
--   `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   PRIMARY KEY (`id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- PASTE YOUR SHOW CREATE TABLE RESULTS BELOW THIS LINE
-- =====================================================
CREATE TABLE `inteli_assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `institution_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `show_teacher_name` tinyint NOT NULL DEFAULT '0',
  `name` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(1024) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `difficulty_level` enum('Easy','Intermediate','Difficult') COLLATE utf8mb3_unicode_ci NOT NULL,
  `educational_level` enum('Primary','Secondary','Technical','University','Professional') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `output_language` enum('es','en') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `evaluation_context` varchar(1024) COLLATE utf8mb3_unicode_ci NOT NULL,
  `case_text` varchar(8192) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `questions_per_skill` int NOT NULL,
  `available_from` datetime NOT NULL,
  `available_until` datetime NOT NULL,
  `dispute_period` int NOT NULL DEFAULT '3',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_ia_institution_idx` (`institution_id`),
  KEY `fk_ia_user_idx` (`teacher_id`),
  CONSTRAINT `fk_ia_institution` FOREIGN KEY (`institution_id`) REFERENCES `inteli_institutions` (`id`),
  CONSTRAINT `fk_ia_user` FOREIGN KEY (`teacher_id`) REFERENCES `inteli_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_assessments_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `user_id` int NOT NULL,
  `final_grade` decimal(9,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('In progress','Completed') COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_aa_assessment_idx` (`assessment_id`),
  KEY `fk_aa_user_idx` (`user_id`),
  CONSTRAINT `fk_aa_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `inteli_assessments` (`id`),
  CONSTRAINT `fk_aa_user` FOREIGN KEY (`user_id`) REFERENCES `inteli_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_assessments_conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attempt_id` int NOT NULL,
  `message_type` enum('student','ai') COLLATE utf8mb3_unicode_ci NOT NULL,
  `message_text` mediumtext COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `attempt_id` (`attempt_id`),
  CONSTRAINT `inteli_assessments_conversations_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `inteli_assessments_attempts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_assessments_disputes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `result_id` int NOT NULL,
  `status` enum('Pending','Under review','Rejected','Solved') COLLATE utf8mb3_unicode_ci NOT NULL,
  `student_argument` varchar(1024) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `teacher_argument` varchar(1024) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_ad_result_idx` (`result_id`),
  CONSTRAINT `fk_ad_result` FOREIGN KEY (`result_id`) REFERENCES `inteli_assessments_results` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_assessments_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_ag_assessment_idx` (`assessment_id`),
  KEY `fk_ag_group_idx` (`group_id`),
  CONSTRAINT `fk_ag_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `inteli_assessments` (`id`),
  CONSTRAINT `fk_ag_group` FOREIGN KEY (`group_id`) REFERENCES `inteli_groups` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_assessments_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attempt_id` int NOT NULL,
  `skill_id` int NOT NULL,
  `skill_level_id` int NOT NULL,
  `feedback` varchar(1256) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_ar_attempt_idx` (`attempt_id`),
  KEY `fk_ar_skill_level_idx` (`skill_level_id`),
  KEY `fk_ar_skill_idx` (`skill_id`),
  CONSTRAINT `fk_ar_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `inteli_assessments_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ar_skill` FOREIGN KEY (`skill_id`) REFERENCES `inteli_skills` (`id`),
  CONSTRAINT `fk_ar_skill_level` FOREIGN KEY (`skill_level_id`) REFERENCES `inteli_skills_levels` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_assessments_skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `skill_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_as_assessment_idx` (`assessment_id`),
  KEY `fk_as_skill_idx` (`skill_id`),
  CONSTRAINT `fk_as_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `inteli_assessments` (`id`),
  CONSTRAINT `fk_as_skill` FOREIGN KEY (`skill_id`) REFERENCES `inteli_skills` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_domains` (
  `id` int NOT NULL AUTO_INCREMENT,
  `institution_id` int NOT NULL,
  `name` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(1024) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_institution_domains` (`institution_id`),
  CONSTRAINT `fk_institution_domains` FOREIGN KEY (`institution_id`) REFERENCES `inteli_institutions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `institution_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`),
  KEY `fk_institution_groups` (`institution_id`),
  CONSTRAINT `fk_institution_groups` FOREIGN KEY (`institution_id`) REFERENCES `inteli_institutions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_institutions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `contact_name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `contact_email` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_prompts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purpose` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `prompt` varchar(1024) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `institution_id` int NOT NULL,
  `domain_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(1024) COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_institution_skills` (`institution_id`),
  KEY `fk_is_domain_idx` (`domain_id`),
  CONSTRAINT `fk_institution_skills` FOREIGN KEY (`institution_id`) REFERENCES `inteli_institutions` (`id`),
  CONSTRAINT `fk_is_domain` FOREIGN KEY (`domain_id`) REFERENCES `inteli_domains` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_skills_levels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `skill_id` int NOT NULL,
  `order` int NOT NULL,
  `label` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(1024) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_sl_skill_idx` (`skill_id`),
  CONSTRAINT `fk_sl_skill` FOREIGN KEY (`skill_id`) REFERENCES `inteli_skills` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_skills_levels_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `institution_id` int NOT NULL,
  `order` int NOT NULL,
  `label` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(1024) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `institution_id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `given_name` varchar(45) COLLATE utf8mb3_unicode_ci NOT NULL,
  `family_name` varchar(45) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `role` enum('student','teacher','clerk','admin') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `language_preference` char(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'es',
  `reset_token` varchar(128) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  KEY `fk_institution_idx` (`institution_id`),
  CONSTRAINT `fk_institution` FOREIGN KEY (`institution_id`) REFERENCES `inteli_institutions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci

CREATE TABLE `inteli_users_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `user_id_idx` (`user_id`),
  KEY `group_id_idx` (`group_id`),
  CONSTRAINT `group_id` FOREIGN KEY (`group_id`) REFERENCES `inteli_groups` (`id`),
  CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `inteli_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci