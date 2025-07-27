-- Phase 2: Apply Sources Schema and Message Subtype Changes
-- This script applies the database changes for skill sources management and clarification turn tracking

-- 1. Add message_subtype to conversations table
ALTER TABLE inteli_assessments_conversations 
ADD COLUMN message_subtype ENUM('regular', 'clarification_question', 'clarification_response') 
DEFAULT 'regular' 
AFTER message_text;

-- 2. Create sources table
CREATE TABLE IF NOT EXISTS inteli_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  authors VARCHAR(500),
  publication_year INT,
  source_type ENUM('textbook', 'journal_article', 'academic_paper', 'online_resource') NOT NULL,
  url VARCHAR(1000),
  doi VARCHAR(100),
  description TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_source_type (source_type),
  INDEX idx_is_custom (is_custom),
  INDEX idx_created_by (created_by)
);

-- 3. Create skill-sources relationship table
CREATE TABLE IF NOT EXISTS inteli_skills_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  skill_id INT NOT NULL,
  source_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_skill_source (skill_id, source_id),
  FOREIGN KEY (skill_id) REFERENCES inteli_skills(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES inteli_sources(id) ON DELETE CASCADE,
  INDEX idx_skill_id (skill_id),
  INDEX idx_source_id (source_id)
);

-- 4. Create indexes for better performance
CREATE INDEX idx_conversations_subtype ON inteli_assessments_conversations(message_subtype);
CREATE INDEX idx_conversations_type_subtype ON inteli_assessments_conversations(message_type, message_subtype);

-- 5. Insert default sources for different skill categories
INSERT INTO inteli_sources (title, authors, publication_year, source_type, url, doi, description, is_custom) VALUES
-- Mathematics
('Principles of Mathematical Analysis', 'Walter Rudin', 1976, 'textbook', NULL, NULL, 'Comprehensive textbook on real analysis and mathematical foundations', FALSE),
('Calculus: Early Transcendentals', 'James Stewart', 2015, 'textbook', NULL, NULL, 'Standard calculus textbook covering differential and integral calculus', FALSE),
('Linear Algebra and Its Applications', 'Gilbert Strang', 2016, 'textbook', NULL, NULL, 'Introduction to linear algebra with applications', FALSE),
('Introduction to Probability and Statistics', 'William Mendenhall', 2012, 'textbook', NULL, NULL, 'Comprehensive introduction to probability theory and statistical methods', FALSE),

-- Computer Science
('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', 2009, 'textbook', NULL, NULL, 'Comprehensive guide to algorithms and data structures', FALSE),
('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 1994, 'textbook', NULL, NULL, 'Classic book on software design patterns', FALSE),
('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 2008, 'textbook', NULL, NULL, 'Guide to writing clean, maintainable code', FALSE),
('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', 1999, 'textbook', NULL, NULL, 'Practical guide to software development best practices', FALSE),

-- Business and Management
('Principles of Management', 'Peter Drucker', 1954, 'textbook', NULL, NULL, 'Foundational text on management principles and practices', FALSE),
('Competitive Strategy: Techniques for Analyzing Industries and Competitors', 'Michael E. Porter', 1980, 'textbook', NULL, NULL, 'Classic work on competitive strategy and industry analysis', FALSE),
('The Lean Startup', 'Eric Ries', 2011, 'textbook', NULL, NULL, 'Methodology for developing businesses and products', FALSE),
('Good to Great: Why Some Companies Make the Leap...And Others Don\'t', 'Jim Collins', 2001, 'textbook', NULL, NULL, 'Research on what makes companies transition from good to great', FALSE),

-- Economics
('Principles of Economics', 'N. Gregory Mankiw', 2017, 'textbook', NULL, NULL, 'Comprehensive introduction to economic principles', FALSE),
('Microeconomic Theory', 'Andreu Mas-Colell, Michael D. Whinston, Jerry R. Green', 1995, 'textbook', NULL, NULL, 'Advanced microeconomic theory textbook', FALSE),
('Macroeconomics', 'Olivier Blanchard', 2016, 'textbook', NULL, NULL, 'Comprehensive macroeconomics textbook', FALSE),
('Development as Freedom', 'Amartya Sen', 1999, 'textbook', NULL, NULL, 'Development economics from a capabilities perspective', FALSE),

-- Psychology
('Psychology', 'David G. Myers', 2018, 'textbook', NULL, NULL, 'Comprehensive introduction to psychology', FALSE),
('Cognitive Psychology: Connecting Mind, Research, and Everyday Experience', 'E. Bruce Goldstein', 2018, 'textbook', NULL, NULL, 'Introduction to cognitive psychology and mental processes', FALSE),
('Social Psychology', 'Elliot Aronson, Timothy D. Wilson, Robin M. Akert', 2018, 'textbook', NULL, NULL, 'Comprehensive social psychology textbook', FALSE),
('Abnormal Psychology', 'Ronald J. Comer', 2018, 'textbook', NULL, NULL, 'Study of psychological disorders and their treatment', FALSE),

-- Engineering
('Engineering Mechanics: Statics', 'Russell C. Hibbeler', 2016, 'textbook', NULL, NULL, 'Fundamental principles of statics in engineering', FALSE),
('Engineering Mechanics: Dynamics', 'Russell C. Hibbeler', 2016, 'textbook', NULL, NULL, 'Fundamental principles of dynamics in engineering', FALSE),
('Materials Science and Engineering: An Introduction', 'William D. Callister, David G. Rethwisch', 2018, 'textbook', NULL, NULL, 'Introduction to materials science and engineering', FALSE),
('Thermodynamics: An Engineering Approach', 'Yunus A. Çengel, Michael A. Boles', 2015, 'textbook', NULL, NULL, 'Engineering thermodynamics principles and applications', FALSE),

-- Online Resources
('Khan Academy', 'Various', NULL, 'online_resource', 'https://www.khanacademy.org', NULL, 'Free online educational platform with courses in multiple subjects', FALSE),
('MIT OpenCourseWare', 'Massachusetts Institute of Technology', NULL, 'online_resource', 'https://ocw.mit.edu', NULL, 'Free access to MIT course materials', FALSE),
('Coursera', 'Various Universities', NULL, 'online_resource', 'https://www.coursera.org', NULL, 'Online learning platform with courses from top universities', FALSE),
('edX', 'Various Universities', NULL, 'online_resource', 'https://www.edx.org', NULL, 'Online learning platform offering courses from leading institutions', FALSE);

-- 6. Note: Data access is handled through API endpoints
-- No views needed - we use direct queries in our API routes

-- 7. Note: Skill sources are accessed through the API endpoints
-- No stored procedures needed - we use direct queries in our API routes

-- 9. Note: Conversation analysis is handled in the API layer
-- No views needed - we use direct queries in our API routes

-- 10. Add comments to document the changes
COMMENT ON TABLE inteli_sources IS 'Academic and professional sources for skills';
COMMENT ON TABLE inteli_skills_sources IS 'Many-to-many relationship between skills and sources';
COMMENT ON COLUMN inteli_assessments_conversations.message_subtype IS 'Type of message: regular, clarification_question, or clarification_response';

-- 11. Create indexes for performance optimization
CREATE INDEX idx_sources_type_custom ON inteli_sources(source_type, is_custom);
CREATE INDEX idx_skills_sources_skill ON inteli_skills_sources(skill_id);
CREATE INDEX idx_conversations_attempt_subtype ON inteli_assessments_conversations(attempt_id, message_subtype);

-- 12. Insert sample skill-source relationships for demonstration
-- Note: These will be created when teachers assign sources to skills through the UI
-- This is just a placeholder for demonstration purposes

-- 13. Note: Validation is handled in the API layer
-- We use TypeScript validation and error handling in our routes
-- No database triggers needed - we follow our programming standards

-- 16. Note: Statistics are calculated in the API layer when needed
-- No views needed - we use direct queries in our API routes

-- 17. Note: Skill source statistics are handled in the API layer
-- No views needed - we use direct queries in our API routes

-- 18. Final verification queries
SELECT 'Database schema updated successfully' as status;
SELECT COUNT(*) as total_sources FROM inteli_sources;
SELECT COUNT(*) as total_skill_source_relationships FROM inteli_skills_sources;
SELECT COUNT(*) as conversations_with_subtype FROM inteli_assessments_conversations WHERE message_subtype IS NOT NULL;

-- Note: This script follows our programming standards:
-- - No stored procedures or functions (business logic in API layer)
-- - No database triggers (validation in TypeScript)
-- - No views (data access through API layer)
-- - Simple schema changes with proper indexes
-- - Direct queries handled in our API routes 