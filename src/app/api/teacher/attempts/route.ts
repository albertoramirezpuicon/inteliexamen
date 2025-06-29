import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - List attempts for assessments the teacher is responsible for
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const assessmentId = searchParams.get('assessment_id') || '';
    const teacherId = searchParams.get('teacher_id') || '';
    
    // Get user info from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userInstitutionId = request.headers.get('x-institution-id');
    
    if (!userId || !userInstitutionId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause - filter by teacher's assessments
    let whereClause = 'WHERE a.teacher_id = ? AND a.institution_id = ?';
    const params: any[] = [parseInt(userId), parseInt(userInstitutionId)];
    
    if (search) {
      whereClause += ' AND (CONCAT(u.given_name, " ", u.family_name) LIKE ? OR a.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      whereClause += ' AND att.status = ?';
      params.push(status);
    }
    
    if (assessmentId) {
      whereClause += ' AND att.assessment_id = ?';
      params.push(parseInt(assessmentId));
    }
    
    // Additional filters (if provided and match teacher's data)
    if (teacherId && parseInt(teacherId) === parseInt(userId)) {
      // Already filtered by teacher, no need to add again
    }
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM inteli_assessments_attempts att
       JOIN inteli_assessments a ON att.assessment_id = a.id
       JOIN inteli_users u ON att.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Create a new parameter array for the main query
    const mainQueryParams = [...params, String(limit), String(offset)];

    console.log('SQL Query for Teacher Attempts:', `SELECT ... ${whereClause} ORDER BY att.created_at DESC LIMIT ? OFFSET ?`);
    console.log('Parameters for Teacher Attempts:', mainQueryParams);
    
    // Get attempts with related data
    const attempts = await query(
      `SELECT 
        att.id,
        att.status,
        att.final_grade,
        att.created_at,
        att.completed_at,
        CONCAT(u.given_name, ' ', u.family_name) as student_name,
        u.email as student_email,
        a.name as assessment_name,
        a.description as assessment_description,
        g.name as group_name
      FROM inteli_assessments_attempts att
      JOIN inteli_assessments a ON att.assessment_id = a.id
      JOIN inteli_users u ON att.user_id = u.id
      LEFT JOIN inteli_users_groups ug ON u.id = ug.user_id
      LEFT JOIN inteli_groups g ON ug.group_id = g.id
      ${whereClause}
      ORDER BY att.created_at DESC
      LIMIT ? OFFSET ?`,
      mainQueryParams
    );
    
    return NextResponse.json({
      attempts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching teacher attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
} 