import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - List all groups with member count
export async function GET() {
  try {
    const groups = await query(`
      SELECT 
        g.id,
        g.name,
        g.description,
        g.institution_id,
        g.created_at,
        g.updated_at,
        i.name as institution_name,
        COUNT(ug.user_id) as member_count
      FROM inteli_groups g
      LEFT JOIN inteli_institutions i ON g.institution_id = i.id
      LEFT JOIN inteli_users_groups ug ON g.id = ug.group_id
      GROUP BY g.id, g.name, g.description, g.institution_id, g.created_at, g.updated_at, i.name
      ORDER BY g.created_at DESC
    `);

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST - Create new group
export async function POST(request: Request) {
  try {
    const { name, description, institution_id } = await request.json();

    // Validate required fields
    if (!name || !institution_id) {
      return NextResponse.json(
        { error: 'Name and institution_id are required' },
        { status: 400 }
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
    const result = await query(
      `INSERT INTO inteli_groups (name, description, institution_id) VALUES (?, ?, ?)`,
      [name.trim(), description || '', institution_id]
    );

    // Get the created group
    const newGroups = await query(
      `SELECT 
        id, 
        name, 
        description, 
        institution_id, 
        created_at, 
        updated_at,
        0 as member_count
      FROM inteli_groups 
      WHERE id = ?`,
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