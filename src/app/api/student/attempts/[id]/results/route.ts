import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;

    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    // Get attempt details including institution scoring scale
    const attemptQuery = `
      SELECT 
        aa.id,
        aa.assessment_id,
        aa.user_id,
        aa.final_grade,
        aa.status,
        aa.created_at,
        aa.completed_at,
        i.scoring_scale
      FROM inteli_assessments_attempts aa
      JOIN inteli_assessments a ON aa.assessment_id = a.id
      JOIN inteli_institutions i ON a.institution_id = i.id
      WHERE aa.id = ?
    `;

    const attemptResult = await query(attemptQuery, [attemptId]);
    
    if (!attemptResult || attemptResult.length === 0) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    const attempt = attemptResult[0];

    // Get results with skill and level details
    const resultsQuery = `
      SELECT 
        ar.id,
        ar.attempt_id,
        ar.skill_id,
        ar.skill_level_id,
        ar.grade,
        ar.feedback,
        s.name as skill_name,
        s.description as skill_description,
        sl.label as skill_level_label,
        sl.description as skill_level_description,
        sl.\`order\` as skill_level_order
      FROM inteli_assessments_results ar
      INNER JOIN inteli_skills s ON ar.skill_id = s.id
      INNER JOIN inteli_skills_levels sl ON ar.skill_level_id = sl.id
      WHERE ar.attempt_id = ?
      ORDER BY s.name, sl.\`order\`
    `;

    const resultsResult = await query(resultsQuery, [attemptId]);

    // Format results for frontend
    const formattedResults = resultsResult.map((result: {
      id: number;
      skill_id: number;
      skill_name: string;
      skill_description: string;
      skill_level_id: number;
      skill_level_label: string;
      skill_level_description: string;
      skill_level_order: number;
      grade: number;
      feedback: string;
    }) => ({
      id: result.id,
      skillId: result.skill_id,
      skillName: result.skill_name,
      skillDescription: result.skill_description,
      skillLevelId: result.skill_level_id,
      skillLevelLabel: result.skill_level_label,
      skillLevelDescription: result.skill_level_description,
      skillLevelOrder: result.skill_level_order,
      grade: result.grade,
      feedback: result.feedback
    }));

    return NextResponse.json({
      results: formattedResults,
      maxScore: attempt.scoring_scale || 10
    });

  } catch (error) {
    console.error('Error loading results:', error);
    return NextResponse.json(
      { error: 'Failed to load results' },
      { status: 500 }
    );
  }
} 