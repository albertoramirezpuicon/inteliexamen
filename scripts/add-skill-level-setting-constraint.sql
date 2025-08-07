-- Add foreign key constraint for skill_level_setting_id in inteli_skills_levels table
-- This script should be run on existing databases to add the missing constraint

-- Add the foreign key constraint
ALTER TABLE `inteli_skills_levels` 
ADD CONSTRAINT `fk_sl_setting` 
FOREIGN KEY (`skill_level_setting_id`) 
REFERENCES `inteli_skills_levels_settings` (`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Add index for better performance
ALTER TABLE `inteli_skills_levels` 
ADD INDEX `fk_sl_setting_idx` (`skill_level_setting_id`);

-- Verify the constraint was added
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inteli_skills_levels' 
    AND CONSTRAINT_NAME = 'fk_sl_setting';
