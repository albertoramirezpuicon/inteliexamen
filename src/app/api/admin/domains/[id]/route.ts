import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get domain by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const domains = await query(
      `SELECT 
        d.id, 
        d.institution_id,
        d.name, 
        d.description,
        i.name as institution_name
      FROM inteli_domains d
      LEFT JOIN inteli_institutions i ON d.institution_id = i.id
      WHERE d.id = ?`,
      [id]
    );

    if (domains.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ domain: domains[0] });
  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    );
  }
}

// PUT - Update domain
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { institution_id, name, description } = await request.json();

    // Check if domain exists
    const existingDomains = await query(
      'SELECT id FROM inteli_domains WHERE id = ?',
      [id]
    );

    if (existingDomains.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!institution_id) {
      return NextResponse.json(
        { error: 'Institution is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Domain description is required' },
        { status: 400 }
      );
    }

    // Check if institution exists
    const institutions = await query(
      'SELECT id FROM inteli_institutions WHERE id = ?',
      [institution_id]
    );

    if (institutions.length === 0) {
      return NextResponse.json(
        { error: 'Selected institution does not exist' },
        { status: 400 }
      );
    }

    // Check if name is being changed and if it already exists for this institution
    const nameCheck = await query(
      'SELECT id FROM inteli_domains WHERE name = ? AND institution_id = ? AND id != ?',
      [name.trim(), institution_id, id]
    );

    if (nameCheck.length > 0) {
      return NextResponse.json(
        { error: 'A domain with this name already exists in this institution' },
        { status: 409 }
      );
    }

    // Update domain
    await query(
      `UPDATE inteli_domains 
       SET institution_id = ?, name = ?, description = ? 
       WHERE id = ?`,
      [institution_id, name.trim(), description.trim(), id]
    );

    // Get updated domain with institution information
    const updatedDomains = await query(
      `SELECT 
        d.id, 
        d.institution_id,
        d.name, 
        d.description,
        i.name as institution_name
      FROM inteli_domains d
      LEFT JOIN inteli_institutions i ON d.institution_id = i.id
      WHERE d.id = ?`,
      [id]
    );

    return NextResponse.json({ 
      domain: updatedDomains[0],
      message: 'Domain updated successfully' 
    });
  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

// DELETE - Delete domain
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if domain exists
    const existingDomains = await query(
      'SELECT id FROM inteli_domains WHERE id = ?',
      [id]
    );

    if (existingDomains.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Check if domain has associated skills
    const skills = await query(
      'SELECT COUNT(*) as count FROM inteli_skills WHERE domain_id = ?',
      [id]
    );

    if (skills[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete domain that has associated skills' },
        { status: 409 }
      );
    }

    // Delete domain
    await query('DELETE FROM inteli_domains WHERE id = ?', [id]);

    return NextResponse.json({ 
      message: 'Domain deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
} 