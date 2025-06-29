import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get skills from teacher's institution with assessment count
export async function GET(request: NextRequest) {
  try {
    // Get user info from headers (sent by frontend)
    const teacherInstitutionId = request.headers.get('x-institution-id');
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domain_id');
    
    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    let skillsQuery = `
      SELECT 
        s.id, 
        s.institution_id, 
        s.domain_id, 
        s.name, 
        s.description, 
        i.name as institution_name, 
        d.name as domain_name,
        COUNT(DISTINCT as2.assessment_id) as assessments_count
      FROM inteli_skills s
      LEFT JOIN inteli_institutions i ON s.institution_id = i.id
      LEFT JOIN inteli_domains d ON s.domain_id = d.id
      LEFT JOIN inteli_assessments_skills as2 ON s.id = as2.skill_id
      WHERE s.institution_id = ?
    `;
    
    const queryParams = [teacherInstitutionId];
    
    // Add domain filter if provided
    if (domainId) {
      skillsQuery += ' AND s.domain_id = ?';
      queryParams.push(domainId);
    }
    
    skillsQuery += ' GROUP BY s.id, s.institution_id, s.domain_id, s.name, s.description, i.name, d.name ORDER BY d.name, s.name';

    const skills = await query(skillsQuery, queryParams);
    
    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

// POST - Create new skill
export async function POST(request: NextRequest) {
  try {
    // Get user info from headers (sent by frontend)
    const teacherInstitutionId = request.headers.get('x-institution-id');
    
    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    const { domain_id, name, description } = await request.json();
    
    if (!domain_id || !name || !description) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Check if domain exists and belongs to the teacher's institution
    const [domain] = await query(
      'SELECT id FROM inteli_domains WHERE id = ? AND institution_id = ?', 
      [domain_id, teacherInstitutionId]
    );
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found or does not belong to your institution.' }, 
        { status: 400 }
      );
    }

    // Check for duplicate name in the same domain
    const existing = await query(
      'SELECT id FROM inteli_skills WHERE name = ? AND domain_id = ?', 
      [name.trim(), domain_id]
    );
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A skill with this name already exists in this domain.' }, 
        { status: 409 }
      );
    }

    // Insert new skill
    const result = await query(
      `INSERT INTO inteli_skills (institution_id, domain_id, name, description)
       VALUES (?, ?, ?, ?)`,
      [teacherInstitutionId, domain_id, name.trim(), description.trim()]
    );

    // Return the created skill with info
    const [skill] = await query(
      `SELECT 
        s.id, 
        s.institution_id, 
        s.domain_id, 
        s.name, 
        s.description, 
        i.name as institution_name, 
        d.name as domain_name,
        COUNT(DISTINCT as2.assessment_id) as assessments_count
      FROM inteli_skills s
      LEFT JOIN inteli_institutions i ON s.institution_id = i.id
      LEFT JOIN inteli_domains d ON s.domain_id = d.id
      LEFT JOIN inteli_assessments_skills as2 ON s.id = as2.skill_id
      WHERE s.id = ?
      GROUP BY s.id, s.institution_id, s.domain_id, s.name, s.description, i.name, d.name`,
      [result.insertId]
    );

    return NextResponse.json({ 
      skill, 
      message: 'Skill created successfully' 
    });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
} 