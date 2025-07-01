import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CountResult {
  total: number;
}

// GET - List assessment attempts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const institution = searchParams.get('institution') || 'all';
    const institution_id = searchParams.get('institution_id');
    const assessment_id = searchParams.get('assessment_id');
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const whereConditions = [];
    const params = [];
    
    if (search) {
      whereConditions.push(`(
        CONCAT(u.given_name, ' ', u.family_name) LIKE ? OR 
        u.email LIKE ? OR 
        a.name LIKE ?
      )`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status !== 'all') {
      whereConditions.push('aa.status = ?');
      params.push(status);
    }
    
    if (institution !== 'all') {
      whereConditions.push('i.id = ?');
      params.push(institution);
    }

    // Support for institution_id parameter (new)
    if (institution_id) {
      whereConditions.push('i.id = ?');
      params.push(institution_id);
    }

    // Support for assessment_id parameter (new)
    if (assessment_id) {
      whereConditions.push('a.id = ?');
      params.push(assessment_id);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inteli_assessments_attempts aa
      JOIN inteli_assessments a ON aa.assessment_id = a.id
      JOIN inteli_users u ON aa.user_id = u.id
      JOIN inteli_institutions i ON a.institution_id = i.id
      LEFT JOIN inteli_users t ON a.teacher_id = t.id
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = (countResult as CountResult[])[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Get attempts with pagination
    const attemptsQuery = `
      SELECT 
        aa.id,
        aa.assessment_id,
        a.name as assessment_name,
        aa.user_id,
        CONCAT(u.given_name, ' ', u.family_name) as student_name,
        u.email as student_email,
        i.name as institution_name,
        CONCAT(t.given_name, ' ', t.family_name) as teacher_name,
        aa.status,
        aa.final_grade,
        aa.created_at,
        aa.completed_at
      FROM inteli_assessments_attempts aa
      JOIN inteli_assessments a ON aa.assessment_id = a.id
      JOIN inteli_users u ON aa.user_id = u.id
      JOIN inteli_institutions i ON a.institution_id = i.id
      LEFT JOIN inteli_users t ON a.teacher_id = t.id
      ${whereClause}
      ORDER BY aa.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const attemptsResult = await query(attemptsQuery, [...params, String(limit), String(offset)]);
    
    return NextResponse.json({
      attempts: attemptsResult,
      total,
      totalPages,
      currentPage: page,
      limit
    });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
} 