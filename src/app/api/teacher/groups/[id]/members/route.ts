import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get current members of a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const teacherInstitutionId = request.headers.get('x-institution-id');

    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    // Check if group exists and belongs to teacher's institution
    const existingGroup = await query(
      'SELECT id FROM inteli_groups WHERE id = ? AND institution_id = ?',
      [groupId, teacherInstitutionId]
    );

    if (existingGroup.length === 0) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      );
    }

    // Get current members
    const members = await query(
      `SELECT 
        u.id,
        u.email,
        u.given_name,
        u.family_name,
        u.role,
        u.institution_id
       FROM inteli_users_groups ug
       JOIN inteli_users u ON ug.user_id = u.id
       WHERE ug.group_id = ?
       ORDER BY u.given_name, u.family_name`,
      [groupId]
    );

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group members' },
      { status: 500 }
    );
  }
}

// POST - Add member to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const teacherInstitutionId = request.headers.get('x-institution-id');
    const { user_id } = await request.json();

    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    // Check if group exists and belongs to teacher's institution
    const existingGroup = await query(
      'SELECT institution_id FROM inteli_groups WHERE id = ? AND institution_id = ?',
      [groupId, teacherInstitutionId]
    );

    if (existingGroup.length === 0) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      );
    }

    const groupInstitutionId = existingGroup[0].institution_id;

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
      [groupId, user_id]
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
      [groupId, user_id]
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const teacherInstitutionId = request.headers.get('x-institution-id');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID parameter is required' },
        { status: 400 }
      );
    }

    // Check if group exists and belongs to teacher's institution
    const existingGroup = await query(
      'SELECT id FROM inteli_groups WHERE id = ? AND institution_id = ?',
      [groupId, teacherInstitutionId]
    );

    if (existingGroup.length === 0) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user is in the group
    const existingMembership = await query(
      'SELECT id FROM inteli_users_groups WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (existingMembership.length === 0) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 404 }
      );
    }

    // Remove user from group
    await query(
      'DELETE FROM inteli_users_groups WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
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