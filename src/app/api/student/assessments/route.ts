import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameters or headers
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || request.headers.get('x-user-id') || '1';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get assessments associated with groups where the user is a member
    const assessments = await query(`
      SELECT DISTINCT
        a.id,
        a.name,
        a.description,
        a.difficulty_level,
        a.educational_level,
        a.evaluation_context,
        a.available_from,
        a.available_until,
        a.dispute_period,
        a.status,
        a.created_at,
        a.updated_at,
        i.name as institution_name,
        t.given_name as teacher_given_name,
        t.family_name as teacher_family_name,
        g.name as group_name,
        g.id as group_id
      FROM inteli_assessments a
      INNER JOIN inteli_assessments_groups ag ON a.id = ag.assessment_id
      INNER JOIN inteli_groups g ON ag.group_id = g.id
      INNER JOIN inteli_users_groups ug ON g.id = ug.group_id
      INNER JOIN inteli_users u ON ug.user_id = u.id
      LEFT JOIN inteli_institutions i ON a.institution_id = i.id
      LEFT JOIN inteli_users t ON a.teacher_id = t.id
      WHERE u.id = ? AND a.status = 'Active'
      AND NOW() BETWEEN a.available_from AND a.available_until
      ORDER BY a.available_from DESC, a.created_at DESC
    `, [userId]);

    // Get assessment attempts for this user
    const attempts = await query(`
      SELECT 
        assessment_id,
        status,
        final_grade,
        created_at,
        completed_at
      FROM inteli_assessments_attempts
      WHERE user_id = ?
    `, [userId]);

    // Create a map of assessment attempts for quick lookup
    const attemptsMap = new Map();
    attempts.forEach(attempt => {
      attemptsMap.set(attempt.assessment_id, attempt);
    });

    // Separate assessments into active (no attempts or incomplete) and completed
    const activeAssessments: any[] = [];
    const completedAssessments: any[] = [];

    assessments.forEach(assessment => {
      const attempt = attemptsMap.get(assessment.id);
      
      if (!attempt || attempt.status === 'In progress') {
        // No attempt or incomplete attempt - show in active assessments
        activeAssessments.push({
          ...assessment,
          attempt: attempt || null
        });
      } else if (attempt.status === 'Completed') {
        // Completed attempt - show in completed assessments
        completedAssessments.push({
          ...assessment,
          attempt: attempt
        });
      }
    });

    return NextResponse.json({
      activeAssessments,
      completedAssessments,
      totalActive: activeAssessments.length,
      totalCompleted: completedAssessments.length
    });
  } catch (error) {
    console.error('Error fetching student assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
} 