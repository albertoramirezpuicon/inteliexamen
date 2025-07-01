import { NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';

// GET - Get all domains with institution information
export async function GET() {
  try {
    const domains = await query(
      `SELECT 
        d.id, 
        d.institution_id,
        d.name, 
        d.description,
        i.name as institution_name
      FROM inteli_domains d
      LEFT JOIN inteli_institutions i ON d.institution_id = i.id
      ORDER BY i.name, d.name`
    );

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST - Create new domain
export async function POST(request: Request) {
  try {
    const { institution_id, name, description } = await request.json();

    // Validate required fields
    if (!institution_id) {
      return NextResponse.json(
        { error: 'Institution is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Domain description is required' },
        { status: 400 }
      );
    }

    // Check if institution exists
    const institutions = await query(
      'SELECT id FROM inteli_institutions WHERE id = ?',
      [institution_id]
    );

    if (institutions.length === 0) {
      return NextResponse.json(
        { error: 'Selected institution does not exist' },
        { status: 400 }
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

    // Create domain
    const result = await insertQuery(
      `INSERT INTO inteli_domains 
        (institution_id, name, description) 
       VALUES (?, ?, ?)`,
      [
        institution_id,
        name.trim(),
        description.trim()
      ]
    );

    // Get the created domain with institution information
    const newDomains = await query(
      `SELECT 
        d.id, 
        d.institution_id,
        d.name, 
        d.description,
        i.name as institution_name
      FROM inteli_domains d
      LEFT JOIN inteli_institutions i ON d.institution_id = i.id
      WHERE d.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({ 
      domain: newDomains[0],
      message: 'Domain created successfully' 
    });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
} 