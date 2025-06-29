import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get groups where the user is a member
    const groups = await query(`
      SELECT 
        g.id,
        g.name,
        g.description,
        g.institution_id,
        g.created_at,
        g.updated_at,
        i.name as institution_name
      FROM inteli_groups g
      INNER JOIN inteli_users_groups ug ON g.id = ug.group_id
      LEFT JOIN inteli_institutions i ON g.institution_id = i.id
      WHERE ug.user_id = ?
      ORDER BY g.created_at DESC
    `, [id]);

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user groups' },
      { status: 500 }
    );
  }
} 