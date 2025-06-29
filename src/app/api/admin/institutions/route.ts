import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get all institutions
export async function GET() {
  try {
    const institutions = await query(
      `SELECT 
        id, 
        name, 
        contact_name, 
        contact_email, 
        created_at, 
        updated_at
      FROM inteli_institutions 
      ORDER BY name`
    );

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
}

// POST - Create new institution
export async function POST(request: Request) {
  try {
    const { name, contact_name, contact_email } = await request.json();

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Institution name is required' },
        { status: 400 }
      );
    }

    if (!contact_name || !contact_name.trim()) {
      return NextResponse.json(
        { error: 'Contact name is required' },
        { status: 400 }
      );
    }

    if (!contact_email || !contact_email.trim()) {
      return NextResponse.json(
        { error: 'Contact email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if institution name already exists
    const existingInstitutions = await query(
      'SELECT id FROM inteli_institutions WHERE name = ?',
      [name.trim()]
    );

    if (existingInstitutions.length > 0) {
      return NextResponse.json(
        { error: 'An institution with this name already exists' },
        { status: 409 }
      );
    }

    // Create institution
    const result = await query(
      `INSERT INTO inteli_institutions 
        (name, contact_name, contact_email, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [
        name.trim(),
        contact_name.trim(),
        contact_email.trim()
      ]
    );

    // Get the created institution
    const newInstitutions = await query(
      `SELECT 
        id, 
        name, 
        contact_name, 
        contact_email, 
        created_at, 
        updated_at
      FROM inteli_institutions 
      WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({ 
      institution: newInstitutions[0],
      message: 'Institution created successfully' 
    });
  } catch (error) {
    console.error('Error creating institution:', error);
    return NextResponse.json(
      { error: 'Failed to create institution' },
      { status: 500 }
    );
  }
} 