import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';

// GET - Get skills associated with a domain
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user info from headers
    const institutionId = request.headers.get('x-institution-id');
    
    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    // Verify domain belongs to the institution
    const domainCheck = await query(
      'SELECT id FROM inteli_domains WHERE id = ? AND institution_id = ?',
      [id, parseInt(institutionId)]
    );

    if (domainCheck.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found or access denied' },
        { status: 404 }
      );
    }

    // Get skills for the domain
    const skillsResult = await query(
      `SELECT 
        s.id,
        s.name,
        s.description
      FROM inteli_skills s
      WHERE s.domain_id = ?
      ORDER BY s.name`,
      [id]
    );

    return NextResponse.json({ skills: skillsResult });
  } catch (error) {
    console.error('Error fetching domain skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain skills' },
      { status: 500 }
    );
  }
}

// POST - Create new skills for a domain
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { skills } = await request.json();
    
    // Get user info from headers
    const institutionId = request.headers.get('x-institution-id');
    
    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: 'Skills array is required' },
        { status: 400 }
      );
    }

    // Verify domain belongs to the institution
    const domainCheck = await query(
      'SELECT id FROM inteli_domains WHERE id = ? AND institution_id = ?',
      [id, parseInt(institutionId)]
    );

    if (domainCheck.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found or access denied' },
        { status: 404 }
      );
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      let createdSkills = 0;
      let duplicateSkills = 0;

      for (const skill of skills) {
        if (!skill.name || !skill.description) {
          continue;
        }

        // Check if skill name already exists in this domain
        const existingSkill = await query(
          'SELECT id FROM inteli_skills WHERE name = ? AND domain_id = ?',
          [skill.name, id]
        );

        if (existingSkill.length > 0) {
          duplicateSkills++;
          continue;
        }

        // Create the skill
        await query(
          'INSERT INTO inteli_skills (name, description, domain_id) VALUES (?, ?, ?)',
          [skill.name, skill.description, id]
        );

        createdSkills++;
      }

      await connection.commit();

      return NextResponse.json({
        message: 'Skills created successfully',
        createdSkills,
        duplicateSkills,
        totalProcessed: skills.length
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating domain skills:', error);
    return NextResponse.json(
      { error: 'Failed to create skills' },
      { status: 500 }
    );
  }
} 