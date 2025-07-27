import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from session or token
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('user-id')?.value ||
                   '1'; // Fallback for development

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { skillId, sourceIds } = await request.json();

    if (!skillId || !sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json(
        { error: 'Skill ID and source IDs are required' },
        { status: 400 }
      );
    }

    // Verify that all sources exist and are not already linked to this skill
    const existingSources = await query(
      `SELECT id FROM inteli_sources WHERE id IN (${sourceIds.map(() => '?').join(',')})`,
      sourceIds
    );

    if (existingSources.length !== sourceIds.length) {
      return NextResponse.json(
        { error: 'Some sources do not exist' },
        { status: 400 }
      );
    }

    // Link sources to the skill (ignore conflicts if already linked)
    for (const sourceId of sourceIds) {
      await insertQuery(
        `INSERT IGNORE INTO inteli_skills_sources (skill_id, source_id) VALUES (?, ?)`,
        [skillId, sourceId]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${sourceIds.length} source(s) to the skill`
    });

  } catch (error) {
    console.error('Error linking sources:', error);
    return NextResponse.json(
      { error: 'Failed to link sources' },
      { status: 500 }
    );
  }
} 