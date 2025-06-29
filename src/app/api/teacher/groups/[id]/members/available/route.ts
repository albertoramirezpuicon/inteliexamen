import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get available students for a group (same institution, student role, not in group)
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
      'SELECT institution_id FROM inteli_groups WHERE id = ? AND institution_id = ?',
      [groupId, teacherInstitutionId]
    );

    if (existingGroup.length === 0) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      );
    }

    const institutionId = existingGroup[0].institution_id;

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
      [institutionId, groupId]
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