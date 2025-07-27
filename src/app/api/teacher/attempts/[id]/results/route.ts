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
    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 });
    }

    // Fetch results for the attempt
    const results = await query(
      `SELECT 
        r.id,
        s.name as skill_name,
        l.label as skill_level_label,
        l.\`order\` as skill_level_order,
        r.feedback
      FROM inteli_assessments_results r
      JOIN inteli_skills s ON r.skill_id = s.id
      JOIN inteli_skills_levels l ON r.skill_level_id = l.id
      WHERE r.attempt_id = ?
      ORDER BY s.name ASC, l.order ASC`,
      [attemptId]
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching attempt results:', error);
    return NextResponse.json({ error: 'Failed to fetch attempt results' }, { status: 500 });
  }
} 