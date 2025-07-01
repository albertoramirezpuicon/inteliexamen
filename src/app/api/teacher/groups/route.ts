import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';

interface CountResult { count: number; }

// GET - Get groups from teacher's institution
export async function GET(request: NextRequest) {
  try {
    const teacherInstitutionId = request.headers.get('x-institution-id');

    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    console.log('Teacher groups - Institution ID:', teacherInstitutionId);

    // Get groups from teacher's institution with member count
    const groupsResult = await query(
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
       WHERE g.institution_id = ?
       GROUP BY g.id, g.name, g.description, g.institution_id, i.name, g.created_at, g.updated_at
       ORDER BY g.name ASC`,
      [teacherInstitutionId]
    ) as CountResult[];

    console.log('Found groups:', groupsResult.length);

    return NextResponse.json({
      groups: groupsResult
    });
  } catch (error) {
    console.error('Error fetching teacher groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST - Create new group
export async function POST(request: NextRequest) {
  try {
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

    // Ensure teacher can only create groups for their institution
    if (parseInt(institution_id) !== parseInt(teacherInstitutionId)) {
      return NextResponse.json(
        { error: 'You can only create groups for your institution' },
        { status: 403 }
      );
    }

    // Check if group name already exists for this institution
    const existingGroups = await query(
      'SELECT id FROM inteli_groups WHERE name = ? AND institution_id = ?',
      [name.trim(), institution_id]
    );

    if (existingGroups.length > 0) {
      return NextResponse.json(
        { error: 'A group with this name already exists in this institution' },
        { status: 409 }
      );
    }

    // Insert new group
    const result = await insertQuery(
      `INSERT INTO inteli_groups (name, description, institution_id) VALUES (?, ?, ?)`,
      [name.trim(), description || '', institution_id]
    );

    // Get the created group with member count
    const newGroups = await query(
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
      [result.insertId]
    );

    return NextResponse.json({ 
      group: newGroups[0],
      message: 'Group created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
} 