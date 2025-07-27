import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';

// GET - Get sources for a specific skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: skillId } = await params;
    
    const sources = await query(
      `SELECT 
        s.id,
        s.title,
        s.authors,
        s.publication_year,
        s.pdf_s3_key,
        s.pdf_processing_status,
        s.pdf_upload_date,
        s.pdf_file_size,
        s.is_custom,
        s.created_at
      FROM inteli_sources s
      INNER JOIN inteli_skills_sources ss ON s.id = ss.source_id
      WHERE ss.skill_id = ?
      ORDER BY s.created_at DESC`,
      [skillId]
    );
    
    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching skill sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill sources' },
      { status: 500 }
    );
  }
}

// POST - Add sources to a skill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: skillId } = await params;
    const { sourceIds } = await request.json();
    
    if (!sourceIds || !Array.isArray(sourceIds)) {
      return NextResponse.json(
        { error: 'Source IDs array is required.' },
        { status: 400 }
      );
    }

    // Verify skill exists
    const [skill] = await query(
      'SELECT id FROM inteli_skills WHERE id = ?',
      [skillId]
    );
    
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found.' },
        { status: 404 }
      );
    }

    // Remove existing sources for this skill
    await query(
      'DELETE FROM inteli_skills_sources WHERE skill_id = ?',
      [skillId]
    );

    // Add new sources
    if (sourceIds.length > 0) {
      console.log('Linking sources to skill:', { skillId, sourceIds });
      
      // Use individual inserts instead of bulk insert to avoid syntax issues
      for (const sourceId of sourceIds) {
        await insertQuery(
          'INSERT INTO inteli_skills_sources (skill_id, source_id) VALUES (?, ?)',
          [skillId, sourceId]
        );
      }
      
      console.log('Successfully linked', sourceIds.length, 'sources to skill');
    }

    return NextResponse.json({ 
      message: 'Skill sources updated successfully' 
    });
  } catch (error) {
    console.error('Error updating skill sources:', error);
    return NextResponse.json(
      { error: 'Failed to update skill sources' },
      { status: 500 }
    );
  }
} 