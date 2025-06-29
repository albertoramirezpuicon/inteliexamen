import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// PUT - Update group
export async function PUT(
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

    // Ensure teacher can only update groups from their institution
    if (parseInt(institution_id) !== parseInt(teacherInstitutionId)) {
      return NextResponse.json(
        { error: 'You can only update groups from your institution' },
        { status: 403 }
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

    // Check if group name already exists for this institution (excluding current group)
    const duplicateGroups = await query(
      'SELECT id FROM inteli_groups WHERE name = ? AND institution_id = ? AND id != ?',
      [name.trim(), institution_id, groupId]
    );

    if (duplicateGroups.length > 0) {
      return NextResponse.json(
        { error: 'A group with this name already exists in this institution' },
        { status: 409 }
      );
    }

    // Update group
    await query(
      `UPDATE inteli_groups SET name = ?, description = ? WHERE id = ?`,
      [name.trim(), description || '', groupId]
    );

    // Get the updated group with member count
    const updatedGroups = await query(
      `SELECT 
        g.id,
        g.name,
        g.description,
        g.institution_id,
        i.name as institution_name,
        g.created_at,
        g.updated_at,
        COUNT(ug.user_id) as member_count
       FROM inteli_groups g
       LEFT JOIN inteli_institutions i ON g.institution_id = i.id
       LEFT JOIN inteli_users_groups ug ON g.id = ug.group_id
       WHERE g.id = ?
       GROUP BY g.id, g.name, g.description, g.institution_id, i.name, g.created_at, g.updated_at`,
      [groupId]
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

    // Check if group has members
    const memberCount = await query(
      'SELECT COUNT(*) as count FROM inteli_users_groups WHERE group_id = ?',
      [groupId]
    ) as any[];

    if (memberCount[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group that has members. Please remove all members first.' },
        { status: 400 }
      );
    }

    // Check if group is associated with any assessments
    const assessmentCount = await query(
      'SELECT COUNT(*) as count FROM inteli_assessments_groups WHERE group_id = ?',
      [groupId]
    ) as any[];

    if (assessmentCount[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group that is associated with assessments. Please remove group from assessments first.' },
        { status: 400 }
      );
    }

    // Delete group
    await query('DELETE FROM inteli_groups WHERE id = ?', [groupId]);

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