import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';
import pool from '@/lib/db';

// GET - Get single assessment (restricted to teacher's assessments)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching teacher assessment with ID:', id);
    
    // Get user info from query parameters (sent by frontend)
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const institutionId = searchParams.get('institution_id');
    
    if (!teacherId || !institutionId) {
      return NextResponse.json(
        { error: 'Teacher ID and Institution ID are required' },
        { status: 400 }
      );
    }
    
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
      WHERE a.id = ? AND a.institution_id = ? AND a.teacher_id = ?`,
      [id, parseInt(institutionId), parseInt(teacherId)]
    );
    
    console.log('Query result:', assessmentResult);
    
    if (!assessmentResult.length) {
      console.log('Assessment not found or access denied');
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 404 }
      );
    }
    
    console.log('Returning assessment:', assessmentResult[0]);
    return NextResponse.json({ assessment: assessmentResult[0] });
  } catch (error) {
    console.error('Error fetching teacher assessment:', error);
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

// PUT - Update assessment (restricted to teacher's assessments)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user info from query parameters (sent by frontend)
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const institutionId = searchParams.get('institution_id');
    
    if (!teacherId || !institutionId) {
      return NextResponse.json(
        { error: 'Teacher ID and Institution ID are required' },
        { status: 400 }
      );
    }
    
    const {
      show_teacher_name,
      name,
      description,
      difficulty_level,
      educational_level,
      output_language,
      evaluation_context,
      case_text,
      questions_per_skill,
      available_from,
      available_until,
      dispute_period,
      status,
      skill_id
    } = await request.json();

    // Validation
    if (!name || !description || !difficulty_level || 
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

    // Validate that the skill belongs to the teacher's institution
    const skillCheck = await query(
      `SELECT s.id FROM inteli_skills s 
       JOIN inteli_domains d ON s.domain_id = d.id 
       WHERE s.id = ? AND d.institution_id = ?`,
      [skill_id, parseInt(institutionId)]
    );

    if (skillCheck.length === 0) {
      return NextResponse.json(
        { error: 'Invalid skill selected' },
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
          show_teacher_name = ?, name = ?, description = ?,
          difficulty_level = ?, educational_level = ?, output_language = ?,
          evaluation_context = ?, case_text = ?, questions_per_skill = ?,
          available_from = ?, available_until = ?, dispute_period = ?, status = ?
        WHERE id = ? AND institution_id = ? AND teacher_id = ?`,
        [
          show_teacher_name ? 1 : 0, name, description,
          difficulty_level, educational_level, output_language,
          evaluation_context, sanitizeText(case_text), questions_per_skill,
          available_from, available_until, dispute_period, status,
          id, parseInt(institutionId), parseInt(teacherId)
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
    console.error('Error updating teacher assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete assessment (restricted to teacher's assessments)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user info from query parameters (sent by frontend)
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const institutionId = searchParams.get('institution_id');
    
    if (!teacherId || !institutionId) {
      return NextResponse.json(
        { error: 'Teacher ID and Institution ID are required' },
        { status: 400 }
      );
    }

    // First, verify the assessment belongs to the teacher
    const existingAssessment = await query(
      `SELECT id, name FROM inteli_assessments 
       WHERE id = ? AND institution_id = ? AND teacher_id = ?`,
      [id, parseInt(institutionId), parseInt(teacherId)]
    );

    if (existingAssessment.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 404 }
      );
    }

    // Check if assessment has attempts (prevent deletion if it does)
    const attemptsCheck = await query(
      'SELECT COUNT(*) as count FROM inteli_assessments_attempts WHERE assessment_id = ?',
      [id]
    );

    if (attemptsCheck[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete assessment that has attempts' },
        { status: 400 }
      );
    }

    // Check if assessment has associated groups
    const groupsCheck = await query(
      'SELECT COUNT(*) as count FROM inteli_assessments_groups WHERE assessment_id = ?',
      [id]
    );

    if (groupsCheck[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete assessment that has associated groups. Please remove group associations first.' },
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
      
      // Delete assessment
      await query(
        'DELETE FROM inteli_assessments WHERE id = ? AND institution_id = ? AND teacher_id = ?',
        [id, parseInt(institutionId), parseInt(teacherId)]
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
    console.error('Error deleting teacher assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
