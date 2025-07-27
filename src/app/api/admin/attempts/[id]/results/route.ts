import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get results for a specific attempt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attemptId = parseInt(id);
    
    if (isNaN(attemptId)) {
      return NextResponse.json(
        { error: 'Invalid attempt ID' },
        { status: 400 }
      );
    }

    // Get results for the attempt
    const resultsQuery = `
      SELECT 
        ar.id,
        s.name as skill_name,
        sl.label as skill_level_label,
        ar.feedback,
        ar.skill_level_id
      FROM inteli_assessments_results ar
      JOIN inteli_skills s ON ar.skill_id = s.id
      JOIN inteli_skills_levels sl ON ar.skill_level_id = sl.id
      WHERE ar.attempt_id = ?
      ORDER BY s.name
    `;
    
    const results = await query(resultsQuery, [attemptId]);
    
    return NextResponse.json({
      results,
      attempt_id: attemptId
    });
  } catch (error) {
    console.error('Error fetching attempt results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempt results' },
      { status: 500 }
    );
  }
} 