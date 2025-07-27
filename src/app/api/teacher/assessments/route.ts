import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';
import pool from '@/lib/db';

// GET - List assessments with filtering and pagination (restricted to teacher's institution and assessments)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const institutionId = searchParams.get('institution_id') || '';
    const teacherId = searchParams.get('teacher_id') || '';
    
    // Get user info from query parameters (sent by frontend)
    if (!teacherId || !institutionId) {
      return NextResponse.json(
        { error: 'Teacher ID and Institution ID are required' },
        { status: 400 }
      );
    }
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause - always filter by teacher's institution and their assessments
    let whereClause = 'WHERE a.institution_id = ? AND a.teacher_id = ?';
    const params: (string | number)[] = [parseInt(institutionId), parseInt(teacherId)];
    
    if (search) {
      whereClause += ' AND (a.name LIKE ? OR a.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM inteli_assessments a ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Create a new parameter array for the main query
    const mainQueryParams = [...params, String(limit), String(offset)];

    console.log('SQL Query for Teacher Assessments:', `SELECT ... ${whereClause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`);
    console.log('Parameters for Teacher Assessments:', mainQueryParams);
    
    // Get assessments with related data
    const assessments = await query(
      `SELECT 
        a.*,
        i.name as institution_name,
        CONCAT(u.given_name, ' ', u.family_name) as teacher_name,
        s.name as skill_name,
        s.description as skill_description,
        d.name as domain_name,
        GROUP_CONCAT(DISTINCT g.name ORDER BY g.name ASC SEPARATOR ', ') as associated_groups,
        (SELECT COUNT(*) FROM inteli_assessments_attempts aa WHERE aa.assessment_id = a.id) as attempt_count
      FROM inteli_assessments a
      LEFT JOIN inteli_institutions i ON a.institution_id = i.id
      LEFT JOIN inteli_users u ON a.teacher_id = u.id
      LEFT JOIN inteli_assessments_skills aas ON a.id = aas.assessment_id
      LEFT JOIN inteli_skills s ON aas.skill_id = s.id
      LEFT JOIN inteli_domains d ON s.domain_id = d.id
      LEFT JOIN inteli_assessments_groups ag ON a.id = ag.assessment_id
      LEFT JOIN inteli_groups g ON ag.group_id = g.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?`,
      mainQueryParams
    );
    
    return NextResponse.json({
      assessments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching teacher assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

// POST - Create new assessment (restricted to teacher's institution)
export async function POST(request: NextRequest) {
  try {
    const {
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
      selected_skills,
      selected_groups,
      selected_sources,
      teacher_id,
      institution_id
    } = await request.json();

    // Get user info from request body
    if (!teacher_id || !institution_id) {
      return NextResponse.json(
        { error: 'Teacher ID and Institution ID are required' },
        { status: 400 }
      );
    }

    // Validation
    if (!name || !description || !difficulty_level || 
        !educational_level || !output_language || !evaluation_context || !case_text || 
        !questions_per_skill || !available_from || !available_until || !dispute_period || 
        !selected_skills || selected_skills.length === 0) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate maximum skills
    if (selected_skills.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 skills allowed per assessment' },
        { status: 400 }
      );
    }

    // Validate dates
    const availableFrom = new Date(available_from);
    const availableUntil = new Date(available_until);
    const now = new Date();

    if (availableFrom < now) {
      return NextResponse.json(
        { error: 'Available from date cannot be in the past' },
        { status: 400 }
      );
    }

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

    // Validate that all skills belong to the teacher's institution
    const skillCheck = await query(
      `SELECT s.id FROM inteli_skills s 
       JOIN inteli_domains d ON s.domain_id = d.id 
       WHERE s.id IN (${selected_skills.map(() => '?').join(',')}) AND d.institution_id = ?`,
      [...selected_skills, parseInt(institution_id)]
    );

    if (skillCheck.length !== selected_skills.length) {
      return NextResponse.json(
        { error: 'One or more invalid skills selected' },
        { status: 400 }
      );
    }

    // Validate that all groups belong to the teacher's institution (if any selected)
    if (selected_groups && selected_groups.length > 0) {
      const groupCheck = await query(
        `SELECT id FROM inteli_groups WHERE id IN (${selected_groups.map(() => '?').join(',')}) AND institution_id = ?`,
        [...selected_groups, parseInt(institution_id)]
      );

      if (groupCheck.length !== selected_groups.length) {
        return NextResponse.json(
          { error: 'One or more invalid groups selected' },
          { status: 400 }
        );
      }
    }
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert assessment
      const result = await insertQuery(
        `INSERT INTO inteli_assessments (
          institution_id, teacher_id, show_teacher_name, integrity_protection, name, description,
          difficulty_level, educational_level, output_language, evaluation_context,
          case_text, case_sections, case_navigation_enabled, case_sections_metadata,
          questions_per_skill, available_from, available_until,
          dispute_period, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parseInt(institution_id), parseInt(teacher_id), show_teacher_name ? 1 : 0, integrity_protection ? 1 : 0, name, description,
          difficulty_level, educational_level, output_language, evaluation_context,
          sanitizeText(case_text), 
          case_sections ? JSON.stringify(case_sections) : null,
          case_navigation_enabled ? 1 : 0,
          case_sections_metadata ? JSON.stringify(case_sections_metadata) : null,
          questions_per_skill, available_from, available_until,
          dispute_period, status || 'Active'
        ]
      );
      
      const assessmentId = result.insertId;
      
      // Insert assessment-skill relationships
      for (const skillId of selected_skills) {
        await query(
          'INSERT INTO inteli_assessments_skills (assessment_id, skill_id) VALUES (?, ?)',
          [assessmentId, skillId]
        );
      }

      // Insert assessment-source relationships (if sources are provided)
      if (selected_sources && Object.keys(selected_sources).length > 0) {
        const allSourceIds = new Set<number>();
        
        // Collect all source IDs from all skills
        for (const skillId of selected_skills) {
          const sourcesForSkill = selected_sources[skillId] || [];
          sourcesForSkill.forEach(sourceId => allSourceIds.add(sourceId));
        }
        
        // Insert assessment-source relationships
        for (const sourceId of allSourceIds) {
          await query(
            'INSERT INTO inteli_assessments_sources (assessment_id, source_id) VALUES (?, ?)',
            [assessmentId, sourceId]
          );
        }
      }

      // Insert assessment-group relationships (if any groups selected)
      if (selected_groups && selected_groups.length > 0) {
        for (const groupId of selected_groups) {
          await query(
            'INSERT INTO inteli_assessments_groups (assessment_id, group_id) VALUES (?, ?)',
            [assessmentId, groupId]
          );
        }
      }
      
      await connection.commit();
      
      // Get the created assessment with related data
      const assessmentResult = await query(
        `SELECT 
          a.*,
          i.name as institution_name,
          CONCAT(u.given_name, ' ', u.family_name) as teacher_name,
          s.name as skill_name,
          s.description as skill_description,
          d.name as domain_name
        FROM inteli_assessments a
        LEFT JOIN inteli_institutions i ON a.institution_id = i.id
        LEFT JOIN inteli_users u ON a.teacher_id = u.id
        LEFT JOIN inteli_assessments_skills aas ON a.id = aas.assessment_id
        LEFT JOIN inteli_skills s ON aas.skill_id = s.id
        LEFT JOIN inteli_domains d ON s.domain_id = d.id
        WHERE a.id = ?`,
        [assessmentId]
      );
      
      return NextResponse.json({
        message: 'Assessment created successfully',
        assessment: assessmentResult[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating teacher assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
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