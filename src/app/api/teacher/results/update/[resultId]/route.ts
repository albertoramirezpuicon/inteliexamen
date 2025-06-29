import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const { resultId } = await params;
    const body = await request.json();
    const { skill_level_id, feedback } = body;

    console.log('Updating result:', resultId, body);

    // Validate required fields
    if (!skill_level_id || !feedback) {
      return NextResponse.json(
        { error: 'Skill level ID and feedback are required' },
        { status: 400 }
      );
    }

    // Update the assessment result
    const updateQuery = `
      UPDATE inteli_assessments_results 
      SET skill_level_id = ?, feedback = ?
      WHERE id = ?
    `;

    const updateResult = await query(updateQuery, [skill_level_id, feedback, resultId]);
    console.log('Update result:', updateResult);

    // Get the updated result
    const getResultQuery = `
      SELECT 
        ar.id,
        ar.attempt_id,
        ar.skill_id,
        ar.skill_level_id,
        ar.feedback,
        s.name as skill_name,
        sl.label as skill_level_label
      FROM inteli_assessments_results ar
      JOIN inteli_skills s ON ar.skill_id = s.id
      JOIN inteli_skills_levels sl ON ar.skill_level_id = sl.id
      WHERE ar.id = ?
    `;

    const results = await query(getResultQuery, [resultId]);

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      result: results[0]
    });

  } catch (error) {
    console.error('Error updating result:', error);
    return NextResponse.json(
      { error: 'Failed to update result' },
      { status: 500 }
    );
  }
} 