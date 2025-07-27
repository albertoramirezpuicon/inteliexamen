-- Apply Sources Schema Changes
-- Run this script to add the sources system to your database

-- 1. Add message_subtype to conversations table
ALTER TABLE inteli_assessments_conversations 
ADD COLUMN message_subtype ENUM('regular', 'clarification_question', 'clarification_response') 
DEFAULT 'regular' AFTER message_type;

-- 2. Create sources table
CREATE TABLE inteli_sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(500) NOT NULL,
    authors VARCHAR(500),
    publication_year INT,
    source_type ENUM('book', 'journal_article', 'framework', 'website', 'report', 'other') NOT NULL,
    url TEXT,
    doi VARCHAR(100),
    description TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES inteli_users(id) ON DELETE SET NULL
);

-- 3. Create skill-source relationships table
CREATE TABLE inteli_skills_sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    skill_id INT NOT NULL,
    source_id INT NOT NULL,
    relevance_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES inteli_skills(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES inteli_sources(id) ON DELETE CASCADE,
    UNIQUE KEY unique_skill_source (skill_id, source_id)
);

-- 4. Create indexes for better performance
CREATE INDEX idx_sources_type ON inteli_sources(source_type);
CREATE INDEX idx_sources_custom ON inteli_sources(is_custom);
CREATE INDEX idx_skills_sources_skill ON inteli_skills_sources(skill_id);
CREATE INDEX idx_conversations_subtype ON inteli_assessments_conversations(message_subtype); 