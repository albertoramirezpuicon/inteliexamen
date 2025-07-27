import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skillId');

    if (!skillId) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    // Get all sources that are not linked to ANY skill
    const unlinkedSources = await query(`
      SELECT 
        s.id,
        s.title,
        s.authors,
        s.publication_year as year,
        s.pdf_file_size as file_size,
        s.pdf_processing_status,
        s.is_custom,
        s.created_at
      FROM inteli_sources s
      WHERE s.id NOT IN (
          SELECT DISTINCT source_id 
          FROM inteli_skills_sources 
          WHERE source_id IS NOT NULL
        )
      ORDER BY s.created_at DESC
    `);

    return NextResponse.json({
      sources: unlinkedSources
    });

  } catch (error) {
    console.error('Error fetching unlinked sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unlinked sources' },
      { status: 500 }
    );
  }
} 