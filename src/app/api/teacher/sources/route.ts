import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';

// GET - Get available sources for teacher's institution
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skill_id');
    
    let sourcesQuery = `
      SELECT 
        s.id,
        s.title,
        s.authors,
        s.publication_year,
        s.pdf_s3_key,
        s.pdf_processing_status,
        s.pdf_upload_date,
        s.pdf_file_size,
        s.is_custom,
        s.created_by,
        s.created_at,
        CASE 
          WHEN ss.skill_id IS NOT NULL THEN TRUE 
          ELSE FALSE 
        END as is_selected
      FROM inteli_sources s
      LEFT JOIN inteli_skills_sources ss ON s.id = ss.source_id AND ss.skill_id = ?
      WHERE s.is_custom = FALSE
    `;
    
    const queryParams = [skillId || null];
    
    sourcesQuery += ' ORDER BY s.created_at DESC';
    
    const sources = await query(sourcesQuery, queryParams);
    
    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

// POST - Add custom source (legacy endpoint - use /upload for new sources)
export async function POST(request: NextRequest) {
  try {
    const { title, authors, publication_year } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required.' },
        { status: 400 }
      );
    }

    // Insert new custom source (without PDF for backward compatibility)
    const result = await insertQuery(
      `INSERT INTO inteli_sources (title, authors, publication_year, pdf_processing_status, is_custom, created_by)
       VALUES (?, ?, ?, 'pending', TRUE, ?)`,
      [title.trim(), authors?.trim() || null, publication_year || null, null] // created_by will be set when we have user context
    );

    // Return the created source
    const [source] = await query(
      `SELECT * FROM inteli_sources WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({ 
      source, 
      message: 'Source created successfully' 
    });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    );
  }
}

// Helper function to validate URL
function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
} 