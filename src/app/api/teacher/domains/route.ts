import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get domains from teacher's institution
export async function GET(request: NextRequest) {
  try {
    const teacherInstitutionId = request.headers.get('x-institution-id');

    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    console.log('Teacher domains - Institution ID:', teacherInstitutionId);

    // Get domains from teacher's institution with skills count
    const domainsResult = await query(
      `SELECT 
        d.id,
        d.name,
        d.description,
        d.institution_id,
        i.name as institution_name,
        COUNT(s.id) as skills_count
       FROM inteli_domains d
       LEFT JOIN inteli_institutions i ON d.institution_id = i.id
       LEFT JOIN inteli_skills s ON d.id = s.domain_id
       WHERE d.institution_id = ?
       GROUP BY d.id, d.name, d.description, d.institution_id, i.name
       ORDER BY d.name ASC`,
      [teacherInstitutionId]
    ) as any[];

    console.log('Found domains:', domainsResult.length);

    return NextResponse.json({
      domains: domainsResult
    });
  } catch (error) {
    console.error('Error fetching teacher domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST - Create new domain
export async function POST(request: NextRequest) {
  try {
    const teacherInstitutionId = request.headers.get('x-institution-id');
    const { name, description, institution_id } = await request.json();

    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name || !institution_id) {
      return NextResponse.json(
        { error: 'Name and institution_id are required' },
        { status: 400 }
      );
    }

    // Ensure teacher can only create domains for their institution
    if (parseInt(institution_id) !== parseInt(teacherInstitutionId)) {
      return NextResponse.json(
        { error: 'You can only create domains for your institution' },
        { status: 403 }
      );
    }

    // Check if domain name already exists for this institution
    const existingDomains = await query(
      'SELECT id FROM inteli_domains WHERE name = ? AND institution_id = ?',
      [name.trim(), institution_id]
    );

    if (existingDomains.length > 0) {
      return NextResponse.json(
        { error: 'A domain with this name already exists in this institution' },
        { status: 409 }
      );
    }

    // Insert new domain
    const result = await query(
      `INSERT INTO inteli_domains (name, description, institution_id) VALUES (?, ?, ?)`,
      [name.trim(), description || '', institution_id]
    );

    // Get the created domain with skills count
    const newDomains = await query(
      `SELECT 
        d.id,
        d.name,
        d.description,
        d.institution_id,
        i.name as institution_name,
        COUNT(s.id) as skills_count
       FROM inteli_domains d
       LEFT JOIN inteli_institutions i ON d.institution_id = i.id
       LEFT JOIN inteli_skills s ON d.id = s.domain_id
       WHERE d.id = ?
       GROUP BY d.id, d.name, d.description, d.institution_id, i.name`,
      [result.insertId]
    );

    return NextResponse.json({ 
      domain: newDomains[0],
      message: 'Domain created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
} 