import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get specific group with members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get group details
    const groups = await query(
      `SELECT 
        g.id,
        g.name,
        g.description,
        g.institution_id,
        g.created_at,
        g.updated_at
      FROM inteli_groups g
      WHERE g.id = ?`,
      [id]
    );

    if (groups.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const group = groups[0];

    // Get current members
    const members = await query(
      `SELECT 
        u.id,
        u.email,
        u.given_name,
        u.family_name,
        u.role,
        u.institution_id
      FROM inteli_users u
      INNER JOIN inteli_users_groups ug ON u.id = ug.user_id
      WHERE ug.group_id = ?
      ORDER BY u.given_name, u.family_name`,
      [id]
    );

    return NextResponse.json({ 
      group: {
        ...group,
        members
      }
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

// PUT - Update group
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, institution_id } = await request.json();

    // Validate required fields
    if (!name || !institution_id) {
      return NextResponse.json(
        { error: 'Name and institution_id are required' },
        { status: 400 }
      );
    }

    // Check if group exists
    const existingGroups = await query(
      'SELECT id FROM inteli_groups WHERE id = ?',
      [id]
    );

    if (existingGroups.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if name already exists for this institution (excluding current group)
    const duplicateGroups = await query(
      'SELECT id FROM inteli_groups WHERE name = ? AND institution_id = ? AND id != ?',
      [name.trim(), institution_id, id]
    );

    if (duplicateGroups.length > 0) {
      return NextResponse.json(
        { error: 'A group with this name already exists in this institution' },
        { status: 409 }
      );
    }

    // Update group
    await query(
      `UPDATE inteli_groups 
       SET name = ?, description = ?, institution_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [name.trim(), description || '', institution_id, id]
    );

    // Get the updated group
    const updatedGroups = await query(
      `SELECT 
        id, 
        name, 
        description, 
        institution_id, 
        created_at, 
        updated_at
      FROM inteli_groups 
      WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ 
      group: updatedGroups[0],
      message: 'Group updated successfully' 
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

// DELETE - Delete group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if group exists
    const existingGroups = await query(
      'SELECT id FROM inteli_groups WHERE id = ?',
      [id]
    );

    if (existingGroups.length === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Delete group members first (due to foreign key constraint)
    await query(
      'DELETE FROM inteli_users_groups WHERE group_id = ?',
      [id]
    );

    // Delete group
    await query(
      'DELETE FROM inteli_groups WHERE id = ?',
      [id]
    );

    return NextResponse.json({ 
      message: 'Group deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
} 