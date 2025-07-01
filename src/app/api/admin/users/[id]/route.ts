import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

// GET - Get user by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('GET /api/admin/users/[id] - Starting request');
    
    const { id } = await params;
    console.log('User ID from params:', id);
    
    const users = await query(
      `SELECT 
        id, 
        institution_id, 
        email, 
        given_name, 
        family_name, 
        role, 
        language_preference, 
        created_at, 
        updated_at
      FROM inteli_users 
      WHERE id = ?`,
      [id]
    );

    console.log('Users query result:', users);
    console.log('Number of users found:', users.length);

    if (users.length === 0) {
      console.log('User not found for ID:', id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];
    console.log('Returning user data:', user);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email, password, given_name, family_name, role, institution_id, language_preference } = await request.json();

    // Check if user exists
    const existingUsers = await query(
      'SELECT id FROM inteli_users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM inteli_users WHERE email = ? AND id != ?',
        [email.toLowerCase().trim(), id]
      );

      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email.toLowerCase().trim());
    }
    if (given_name) {
      updateFields.push('given_name = ?');
      updateValues.push(given_name);
    }
    if (family_name) {
      updateFields.push('family_name = ?');
      updateValues.push(family_name);
    }
    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (institution_id) {
      updateFields.push('institution_id = ?');
      updateValues.push(institution_id);
    }
    if (language_preference) {
      updateFields.push('language_preference = ?');
      updateValues.push(language_preference);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    // Update user
    await query(
      `UPDATE inteli_users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user
    const updatedUsers = await query(
      `SELECT 
        id, 
        institution_id, 
        email, 
        given_name, 
        family_name, 
        role, 
        language_preference, 
        created_at, 
        updated_at
      FROM inteli_users 
      WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ 
      user: updatedUsers[0],
      message: 'User updated successfully' 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user exists
    const existingUsers = await query(
      'SELECT id FROM inteli_users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    await query('DELETE FROM inteli_users WHERE id = ?', [id]);

    return NextResponse.json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 