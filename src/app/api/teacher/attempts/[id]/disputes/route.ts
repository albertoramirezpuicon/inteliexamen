import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get disputes for a specific attempt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attemptId = parseInt(id);
    
    // Get disputes for this attempt with student and result information
    const disputesQuery = `
      SELECT 
        d.id,
        d.result_id,
        d.status,
        d.student_argument,
        d.teacher_argument,
        d.created_at,
        d.update_at,
        CONCAT(u.given_name, ' ', u.family_name) as student_name,
        u.email as student_email,
        s.name as skill_name,
        sl.label as current_skill_level,
        ar.feedback as current_feedback,
        ar.skill_level_id,
        ar.skill_id
      FROM inteli_assessments_disputes d
      JOIN inteli_assessments_results ar ON d.result_id = ar.id
      JOIN inteli_assessments_attempts aa ON ar.attempt_id = aa.id
      JOIN inteli_users u ON aa.user_id = u.id
      JOIN inteli_skills s ON ar.skill_id = s.id
      JOIN inteli_skills_levels sl ON ar.skill_level_id = sl.id
      WHERE ar.attempt_id = ?
      ORDER BY d.created_at DESC
    `;

    const disputes = await query(disputesQuery, [attemptId]);

    return NextResponse.json({
      disputes: disputes || []
    });

  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
} 