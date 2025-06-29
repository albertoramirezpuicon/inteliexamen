import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('Login attempt for email:', email);

    // Find user by email using direct SQL
    const users = await query(
      'SELECT * FROM inteli_users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      console.log('User not found:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];
    console.log('User found:', user.email, 'Role:', user.role);

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Login successful for user:', email);

    // Return user data (excluding password)
    return NextResponse.json({
      user: {
        id: user.id,
        institution_id: user.institution_id,
        email: user.email,
        given_name: user.given_name,
        family_name: user.family_name,
        role: user.role,
        language_preference: user.language_preference,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 