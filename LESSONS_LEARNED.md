# Lessons Learned

This document contains important lessons learned during the development of the Inteliexamen Platform.

## Deployment and CI/CD

### GitHub Actions Workflow Management
**Issue**: Attempting to modify the `.github/workflows/deploy.yml` file without user permission
**Problem**: The user has custom deployment logic and manages this file directly
**Solution**: 
- **NEVER modify** the `.github/workflows/deploy.yml file
- Document this rule in README.md and LESSONS_LEARNED.md
- All deployment configuration changes must be made by the user
- The workflow file contains user-specific deployment logic and should remain untouched

**Prevention**: Always ask the user before making any changes to deployment configuration files

## Database and API Issues

### Foreign Key Constraint Errors with AI-Generated IDs
**Problem**: AI was returning skill level IDs that didn't exist in the database, causing foreign key constraint failures when trying to save assessment results.

**Error**: `Cannot add or update a child row: a foreign key constraint fails (inteli_assessments_results, CONSTRAINT fk_ar_skill_level FOREIGN KEY (skill_level_id) REFERENCES inteli_skills_levels (id))`

**Root Cause**: The AI model was generating skill level IDs that didn't match the actual database records, likely because the prompt wasn't explicit enough about using exact IDs.

**Solution**: 
1. Added validation layer that checks if skill level IDs exist before saving
2. Enhanced AI prompts to be more explicit about using exact IDs from provided data
3. Added comprehensive logging to track AI responses and available skill level IDs
4. Improved error messages to clearly indicate when AI provides invalid IDs

**Prevention**: Always validate AI-generated IDs against actual database records before attempting to save them, especially when dealing with foreign key relationships. 