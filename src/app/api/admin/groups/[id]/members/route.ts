import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get current members of a group
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('GET /api/admin/groups/[id]/members - Starting request');
    
    const { id } = await params;
    console.log('Group ID from params:', id);
    
    // Get current members of the group
    const members = await query(
      `SELECT 
        u.id,
        u.email,
        u.given_name,
        u.family_name,
        u.role,
        u.institution_id,
        u.created_at
      FROM inteli_users_groups ug
      JOIN inteli_users u ON ug.user_id = u.id
      WHERE ug.group_id = ?
      ORDER BY u.given_name, u.family_name`,
      [id]
    );

    console.log('Members query result:', members);
    console.log('Number of members found:', members.length);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group members' },
      { status: 500 }
    );
  }
}

// GET - Get available students for a group (same institution, student role, not in group)
export async function GET_AVAILABLE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get group's institution_id
    const groups = await query(
      'SELECT institution_id FROM inteli_groups WHERE id = ?',
      [id]
    );

    if (groups.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const institutionId = groups[0].institution_id;

    // Get available students (not in this group, same institution, student role)
    const availableStudents = await query(
      `SELECT 
        u.id,
        u.email,
        u.given_name,
        u.family_name,
        u.role,
        u.institution_id
      FROM inteli_users u
      WHERE u.role = 'student' 
        AND u.institution_id = ?
        AND u.id NOT IN (
          SELECT ug.user_id 
          FROM inteli_users_groups ug 
          WHERE ug.group_id = ?
        )
      ORDER BY u.given_name, u.family_name`,
      [institutionId, id]
    );

    return NextResponse.json({ availableStudents });
  } catch (error) {
    console.error('Error fetching available students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available students' },
      { status: 500 }
    );
  }
}

// POST - Add member to group
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user_id } = await request.json();

    // Check if group exists
    const groups = await query(
      'SELECT institution_id FROM inteli_groups WHERE id = ?',
      [id]
    );

    if (groups.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const groupInstitutionId = groups[0].institution_id;

    // Check if user exists and is a student from the same institution
    const users = await query(
      `SELECT id, role, institution_id 
       FROM inteli_users 
       WHERE id = ? AND role = 'student' AND institution_id = ?`,
      [user_id, groupInstitutionId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found or is not a student from the same institution' },
        { status: 400 }
      );
    }

    // Check if user is already in the group
    const existingMembership = await query(
      'SELECT id FROM inteli_users_groups WHERE group_id = ? AND user_id = ?',
      [id, user_id]
    );

    if (existingMembership.length > 0) {
      return NextResponse.json(
        { error: 'User is already a member of this group' },
        { status: 409 }
      );
    }

    // Add user to group
    await query(
      'INSERT INTO inteli_users_groups (group_id, user_id) VALUES (?, ?)',
      [id, user_id]
    );

    return NextResponse.json({ 
      message: 'User added to group successfully' 
    });
  } catch (error) {
    console.error('Error adding member to group:', error);
    return NextResponse.json(
      { error: 'Failed to add member to group' },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      );
    }

    // Check if membership exists
    const membership = await query(
      'SELECT id FROM inteli_users_groups WHERE group_id = ? AND user_id = ?',
      [id, user_id]
    );

    if (membership.length === 0) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 404 }
      );
    }

    // Remove user from group
    await query(
      'DELETE FROM inteli_users_groups WHERE group_id = ? AND user_id = ?',
      [id, user_id]
    );

    return NextResponse.json({ 
      message: 'User removed from group successfully' 
    });
  } catch (error) {
    console.error('Error removing member from group:', error);
    return NextResponse.json(
      { error: 'Failed to remove member from group' },
      { status: 500 }
    );
  }
} 