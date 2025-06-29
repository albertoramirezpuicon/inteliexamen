import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get institution by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const institutions = await query(
      `SELECT 
        id, 
        name, 
        contact_name, 
        contact_email, 
        created_at, 
        updated_at
      FROM inteli_institutions 
      WHERE id = ?`,
      [id]
    );

    if (institutions.length === 0) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ institution: institutions[0] });
  } catch (error) {
    console.error('Error fetching institution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institution' },
      { status: 500 }
    );
  }
}

// PUT - Update institution
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, contact_name, contact_email } = await request.json();

    // Check if institution exists
    const existingInstitutions = await query(
      'SELECT id FROM inteli_institutions WHERE id = ?',
      [id]
    );

    if (existingInstitutions.length === 0) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Institution name is required' },
        { status: 400 }
      );
    }

    if (!contact_name || !contact_name.trim()) {
      return NextResponse.json(
        { error: 'Contact name is required' },
        { status: 400 }
      );
    }

    if (!contact_email || !contact_email.trim()) {
      return NextResponse.json(
        { error: 'Contact email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if name is being changed and if it already exists
    const nameCheck = await query(
      'SELECT id FROM inteli_institutions WHERE name = ? AND id != ?',
      [name.trim(), id]
    );

    if (nameCheck.length > 0) {
      return NextResponse.json(
        { error: 'An institution with this name already exists' },
        { status: 409 }
      );
    }

    // Update institution
    await query(
      `UPDATE inteli_institutions 
       SET name = ?, contact_name = ?, contact_email = ?, updated_at = NOW() 
       WHERE id = ?`,
      [name.trim(), contact_name.trim(), contact_email.trim(), id]
    );

    // Get updated institution
    const updatedInstitutions = await query(
      `SELECT 
        id, 
        name, 
        contact_name, 
        contact_email, 
        created_at, 
        updated_at
      FROM inteli_institutions 
      WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ 
      institution: updatedInstitutions[0],
      message: 'Institution updated successfully' 
    });
  } catch (error) {
    console.error('Error updating institution:', error);
    return NextResponse.json(
      { error: 'Failed to update institution' },
      { status: 500 }
    );
  }
}

// DELETE - Delete institution
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if institution exists
    const existingInstitutions = await query(
      'SELECT id FROM inteli_institutions WHERE id = ?',
      [id]
    );

    if (existingInstitutions.length === 0) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    // Check if institution has associated users
    const users = await query(
      'SELECT COUNT(*) as count FROM inteli_users WHERE institution_id = ?',
      [id]
    );

    if (users[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete institution that has associated users' },
        { status: 409 }
      );
    }

    // Check if institution has associated groups
    const groups = await query(
      'SELECT COUNT(*) as count FROM inteli_groups WHERE institution_id = ?',
      [id]
    );

    if (groups[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete institution that has associated groups' },
        { status: 409 }
      );
    }

    // Check if institution has associated assessments
    const assessments = await query(
      'SELECT COUNT(*) as count FROM inteli_assessments WHERE institution_id = ?',
      [id]
    );

    if (assessments[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete institution that has associated assessments' },
        { status: 409 }
      );
    }

    // Check if institution has associated domains
    const domains = await query(
      'SELECT COUNT(*) as count FROM inteli_domains WHERE institution_id = ?',
      [id]
    );

    if (domains[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete institution that has associated domains' },
        { status: 409 }
      );
    }

    // Check if institution has associated skills
    const skills = await query(
      'SELECT COUNT(*) as count FROM inteli_skills WHERE institution_id = ?',
      [id]
    );

    if (skills[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete institution that has associated skills' },
        { status: 409 }
      );
    }

    // Delete institution
    await query('DELETE FROM inteli_institutions WHERE id = ?', [id]);

    return NextResponse.json({ 
      message: 'Institution deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting institution:', error);
    return NextResponse.json(
      { error: 'Failed to delete institution' },
      { status: 500 }
    );
  }
} 