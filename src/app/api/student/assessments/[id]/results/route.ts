import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentIdString } = await params;
    const assessmentId = parseInt(assessmentIdString);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!assessmentId || isNaN(assessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the completed attempt for this assessment and user
    const attemptQuery = `
      SELECT 
        id,
        assessment_id,
        user_id,
        final_grade,
        status,
        created_at,
        completed_at
      FROM inteli_assessments_attempts 
      WHERE assessment_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    console.log('Looking for attempt with assessmentId:', assessmentId, 'userId:', userId);
    const attempts = await query(attemptQuery, [assessmentId, userId]);
    console.log('Attempts query result:', attempts);
    
    if (!attempts || attempts.length === 0) {
      return NextResponse.json(
        { error: 'No attempt found for this assessment' },
        { status: 404 }
      );
    }

    const attempt = attempts[0];
    console.log('Selected attempt:', attempt);

    // Check if attempt is completed
    if (attempt.status !== 'Completed') {
      return NextResponse.json(
        { error: 'Attempt is not completed yet' },
        { status: 400 }
      );
    }

    // Get the results for this attempt
    const resultsQuery = `
      SELECT 
        ar.id,
        ar.skill_id,
        ar.skill_level_id,
        ar.feedback,
        s.name as skill_name,
        sl.label as skill_level_label,
        sl.description as skill_level_description
      FROM inteli_assessments_results ar
      JOIN inteli_skills s ON ar.skill_id = s.id
      JOIN inteli_skills_levels sl ON ar.skill_level_id = sl.id
      WHERE ar.attempt_id = ?
      ORDER BY s.name
    `;

    const results = await query(resultsQuery, [attempt.id]);
    console.log('Results query result:', results);

    // Format the results
    const formattedResults = results.map((result: any) => ({
      id: result.id,
      skillId: result.skill_id,
      skillLevelId: result.skill_level_id,
      skillName: result.skill_name,
      skillLevelLabel: result.skill_level_label,
      skillLevelDescription: result.skill_level_description,
      feedback: result.feedback
    }));

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        assessmentId: attempt.assessment_id,
        userId: attempt.user_id,
        finalGrade: attempt.final_grade,
        status: attempt.status,
        createdAt: attempt.created_at,
        completedAt: attempt.completed_at
      },
      results: formattedResults
    });

  } catch (error) {
    console.error('Error fetching assessment results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 