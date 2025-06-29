import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const userQuery = `
      SELECT id, email, reset_token, reset_token_expiry 
      FROM inteli_users 
      WHERE reset_token = ? AND reset_token_expiry > NOW()
    `;
    
    const users = await query(userQuery, [token]);
    
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const user = users[0];
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update user password and clear reset token
    await query(
      'UPDATE inteli_users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    console.log('Password reset successful for user:', user.email);
    
    return NextResponse.json(
      { message: 'Password reset successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in reset password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 