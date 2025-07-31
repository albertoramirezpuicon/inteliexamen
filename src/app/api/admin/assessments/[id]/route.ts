import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';

// GET - Get single assessment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching assessment with ID:', id);
    
    const assessmentResult = await query(
      `SELECT 
        a.*,
        i.name as institution_name,
        CONCAT(u.given_name, ' ', u.family_name) as teacher_name,
        (SELECT COUNT(*) FROM inteli_assessments_attempts aa WHERE aa.assessment_id = a.id) as attempt_count
      FROM inteli_assessments a
      LEFT JOIN inteli_institutions i ON a.institution_id = i.id
      LEFT JOIN inteli_users u ON a.teacher_id = u.id
      WHERE a.id = ?`,
      [id]
    );
    
    console.log('Query result:', assessmentResult);
    
    if (!assessmentResult.length) {
      console.log('Assessment not found');
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const assessment = assessmentResult[0];

    // Get associated skills
    const skillsResult = await query(
      `SELECT 
        s.id,
        s.name,
        s.description,
        s.domain_id,
        d.name as domain_name
      FROM inteli_assessments_skills aas
      JOIN inteli_skills s ON aas.skill_id = s.id
      JOIN inteli_domains d ON s.domain_id = d.id
      WHERE aas.assessment_id = ?`,
      [id]
    );

    // Get associated groups
    const groupsResult = await query(
      `SELECT 
        g.id,
        g.name,
        g.description,
        g.institution_id,
        COUNT(ug.user_id) as member_count
      FROM inteli_assessments_groups ag
      JOIN inteli_groups g ON ag.group_id = g.id
      LEFT JOIN inteli_users_groups ug ON g.id = ug.group_id
      WHERE ag.assessment_id = ?
      GROUP BY g.id, g.name, g.description, g.institution_id`,
      [id]
    );

    // Get associated sources with skill associations
    const sourcesResult = await query(
      `SELECT 
        s.id,
        s.title,
        s.authors,
        s.publication_year,
        s.pdf_processing_status,
        s.is_custom,
        ss.skill_id
      FROM inteli_assessments_sources aas
      JOIN inteli_sources s ON aas.source_id = s.id
      JOIN inteli_skills_sources ss ON s.id = ss.source_id
      WHERE aas.assessment_id = ?`,
      [id]
    );

    // Group sources by skill
    const sourcesBySkill: Record<number, number[]> = {};
    sourcesResult.forEach(source => {
      if (!sourcesBySkill[source.skill_id]) {
        sourcesBySkill[source.skill_id] = [];
      }
      sourcesBySkill[source.skill_id].push(source.id);
    });

    const assessmentWithRelations = {
      ...assessment,
      selected_skills: skillsResult.map(s => s.id),
      selected_groups: groupsResult.map(g => g.id),
      selected_sources: sourcesResult.map(s => s.id),
      sources_by_skill: sourcesBySkill,
      attempt_count: assessment.attempt_count || 0
    };

    console.log('Returning assessment:', assessmentWithRelations);
    return NextResponse.json({ assessment: assessmentWithRelations });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

// Function to sanitize text for database insertion
function sanitizeText(text: string): string {
  // Remove or replace problematic characters that cause utf8mb3/utf8mb4 collation issues
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Remove emojis
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Remove miscellaneous symbols and pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Remove transport and map symbols
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove regional indicator symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Remove miscellaneous symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Remove dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Remove variation selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Remove supplemental symbols and pictographs
    .replace(/[\u{1F018}-\u{1F270}]/gu, '') // Remove various symbols
    .replace(/[\u{238C}-\u{2454}]/gu, '') // Remove various symbols
    .replace(/[\u{20D0}-\u{20FF}]/gu, '') // Remove combining diacritical marks
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '') // Remove mahjong tiles
    .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '') // Remove playing cards
    .replace(/[\u{1F030}-\u{1F09F}]/gu, '') // Remove domino tiles
    .replace(/[\u{1F0C0}-\u{1F0FF}]/gu, '') // Remove playing cards
    .replace(/[\u{1F100}-\u{1F64F}]/gu, '') // Remove various symbols
    .replace(/[\u{1F650}-\u{1F67F}]/gu, '') // Remove ornamental dingbats
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Remove transport and map symbols
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Remove geometric shapes extended
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Remove supplemental arrows-c
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Remove supplemental symbols and pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Remove chess symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Remove symbols and pictographs extended-a
    .replace(/[\u{1FB00}-\u{1FBFF}]/gu, '') // Remove symbols for legacy computing
    .trim();
}

// PUT - Update assessment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      institution_id,
      teacher_id,
      show_teacher_name,
      integrity_protection,
      name,
      description,
      difficulty_level,
      educational_level,
      output_language,
      evaluation_context,
      case_text,
      case_sections,
      case_navigation_enabled,
      case_sections_metadata,
      questions_per_skill,
      available_from,
      available_until,
      dispute_period,
      status,
      skill_id
    } = await request.json();

    // Validation
    if (!institution_id || !teacher_id || !name || !description || !difficulty_level || 
        !educational_level || !output_language || !evaluation_context || !case_text || 
        !questions_per_skill || !available_from || !available_until || !dispute_period || !skill_id) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate dates
    const availableFrom = new Date(available_from);
    const availableUntil = new Date(available_until);

    if (availableUntil <= availableFrom) {
      return NextResponse.json(
        { error: 'Available until date must be after available from date' },
        { status: 400 }
      );
    }

    if (dispute_period < 3) {
      return NextResponse.json(
        { error: 'Dispute period must be at least 3 days' },
        { status: 400 }
      );
    }
    
    // Check if assessment has attempts
    const attemptsResult = await query(
      'SELECT COUNT(*) as count FROM inteli_assessments_attempts WHERE assessment_id = ?',
      [id]
    );
    
    if (attemptsResult[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot edit assessment that has attempts' },
        { status: 400 }
      );
    }
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update assessment
      await query(
        `UPDATE inteli_assessments SET
          institution_id = ?, teacher_id = ?, show_teacher_name = ?, integrity_protection = ?, name = ?, description = ?,
          difficulty_level = ?, educational_level = ?, output_language = ?, evaluation_context = ?,
          case_text = ?, case_sections = ?, case_navigation_enabled = ?, case_sections_metadata = ?,
          questions_per_skill = ?, available_from = ?, available_until = ?,
          dispute_period = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          institution_id, teacher_id, show_teacher_name ? 1 : 0, integrity_protection ? 1 : 0, name, description,
          difficulty_level, educational_level, output_language, evaluation_context,
          sanitizeText(case_text), 
          case_sections ? JSON.stringify(case_sections) : null,
          case_navigation_enabled ? 1 : 0,
          case_sections_metadata ? JSON.stringify(case_sections_metadata) : null,
          questions_per_skill, available_from, available_until,
          dispute_period, status, id
        ]
      );
      
      // Update assessment-skill relationship
      await query(
        'DELETE FROM inteli_assessments_skills WHERE assessment_id = ?',
        [id]
      );
      
      await query(
        'INSERT INTO inteli_assessments_skills (assessment_id, skill_id) VALUES (?, ?)',
        [id, skill_id]
      );
      
      await connection.commit();
      
      // Get the updated assessment with related data
      const assessmentResult = await query(
        `SELECT 
          a.*,
          i.name as institution_name,
          CONCAT(u.given_name, ' ', u.family_name) as teacher_name,
          s.name as skill_name,
          s.description as skill_description,
          d.name as domain_name,
          d.id as domain_id,
          s.id as skill_id
        FROM inteli_assessments a
        LEFT JOIN inteli_institutions i ON a.institution_id = i.id
        LEFT JOIN inteli_users u ON a.teacher_id = u.id
        LEFT JOIN inteli_assessments_skills aas ON a.id = aas.assessment_id
        LEFT JOIN inteli_skills s ON aas.skill_id = s.id
        LEFT JOIN inteli_domains d ON s.domain_id = d.id
        WHERE a.id = ?`,
        [id]
      );
      
      return NextResponse.json({
        message: 'Assessment updated successfully',
        assessment: assessmentResult[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete assessment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if assessment has attempts
    const attemptsResult = await query(
      'SELECT COUNT(*) as count FROM inteli_assessments_attempts WHERE assessment_id = ?',
      [id]
    );
    
    if (attemptsResult[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete assessment that has attempts' },
        { status: 400 }
      );
    }
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Delete assessment-skill relationships
      await query(
        'DELETE FROM inteli_assessments_skills WHERE assessment_id = ?',
        [id]
      );
      
      // Delete assessment-group relationships
      await query(
        'DELETE FROM inteli_assessments_groups WHERE assessment_id = ?',
        [id]
      );
      
      // Delete the assessment
      await query(
        'DELETE FROM inteli_assessments WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      
      return NextResponse.json({
        message: 'Assessment deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
} 