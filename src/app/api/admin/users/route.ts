import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

// GET - List all users
export async function GET() {
  try {
    const users = await query(`
      SELECT 
        u.id, 
        u.institution_id, 
        u.email, 
        u.given_name, 
        u.family_name, 
        u.role, 
        u.language_preference, 
        u.created_at, 
        u.updated_at,
        i.name as institution_name
      FROM inteli_users u
      LEFT JOIN inteli_institutions i ON u.institution_id = i.id
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const { email, password, given_name, family_name, role, institution_id, language_preference } = await request.json();

    // Validate required fields
    if (!email || !password || !given_name || !family_name || !role || !institution_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id FROM inteli_users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await query(
      `INSERT INTO inteli_users 
       (email, password, given_name, family_name, role, institution_id, language_preference) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        email.toLowerCase().trim(),
        hashedPassword,
        given_name,
        family_name,
        role,
        institution_id,
        language_preference || 'es'
      ]
    );

    // Get the created user
    const newUsers = await query(
      'SELECT id, institution_id, email, given_name, family_name, role, language_preference, created_at, updated_at FROM inteli_users WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({ 
      user: newUsers[0],
      message: 'User created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 