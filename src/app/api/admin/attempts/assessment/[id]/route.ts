import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Assessment {
  id: number;
  name: string;
  description: string;
  difficulty_level: string;
  educational_level: string;
  status: string;
  institution_name: string;
}

interface Attempt {
  id: number;
  user_id: number;
  student_name: string;
  student_email: string;
  status: string;
  final_grade: number | null;
  created_at: string;
  completed_at: string | null;
}

interface CountResult {
  total: number;
}

// GET - Get attempts for a specific assessment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // First, get the assessment details
    const assessmentResult = await query(
      `SELECT 
        a.id,
        a.name,
        a.description,
        a.difficulty_level,
        a.educational_level,
        a.status,
        i.name as institution_name
      FROM inteli_assessments a
      LEFT JOIN inteli_institutions i ON a.institution_id = i.id
      WHERE a.id = ?`,
      [id]
    ) as Assessment[];
    
    if (!assessmentResult.length) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    const assessment = assessmentResult[0];
    
    // Get total count of attempts for this assessment
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM inteli_assessments_attempts aa
       WHERE aa.assessment_id = ?`,
      [id]
    ) as CountResult[];
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Get attempts for this assessment with pagination
    const attemptsResult = await query(
      `SELECT 
        aa.id,
        aa.user_id,
        CONCAT(u.given_name, ' ', u.family_name) as student_name,
        u.email as student_email,
        aa.status,
        aa.final_grade,
        aa.created_at,
        aa.completed_at
      FROM inteli_assessments_attempts aa
      JOIN inteli_users u ON aa.user_id = u.id
      WHERE aa.assessment_id = ?
      ORDER BY aa.created_at DESC
      LIMIT ? OFFSET ?`,
      [id, String(limit), String(offset)]
    ) as Attempt[];
    
    return NextResponse.json({
      assessment,
      attempts: attemptsResult,
      total,
      totalPages,
      currentPage: page,
      limit
    });
  } catch (error) {
    console.error('Error fetching assessment attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment attempts' },
      { status: 500 }
    );
  }
} 