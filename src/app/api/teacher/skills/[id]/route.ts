import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get skill by ID (for teacher's institution)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const institutionId = request.headers.get('x-institution-id');
    
    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    const [skill] = await query(
      `SELECT 
        s.id, 
        s.institution_id, 
        s.domain_id, 
        s.name, 
        s.description, 
        i.name as institution_name, 
        d.name as domain_name,
        COUNT(DISTINCT as2.assessment_id) as assessments_count
      FROM inteli_skills s
      LEFT JOIN inteli_institutions i ON s.institution_id = i.id
      LEFT JOIN inteli_domains d ON s.domain_id = d.id
      LEFT JOIN inteli_assessments_skills as2 ON s.id = as2.skill_id
      WHERE s.id = ? AND s.institution_id = ?
      GROUP BY s.id, s.institution_id, s.domain_id, s.name, s.description, i.name, d.name`,
      [id, institutionId]
    );
    
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }
    
    return NextResponse.json({ skill });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 });
  }
}

// PUT - Update skill (only if not used in assessments)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const institutionId = request.headers.get('x-institution-id');
    
    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    const { domain_id, name, description } = await request.json();
    
    if (!domain_id || !name || !description) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if skill exists and belongs to teacher's institution
    const [skill] = await query(
      'SELECT * FROM inteli_skills WHERE id = ? AND institution_id = ?', 
      [id, institutionId]
    );
    
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found.' }, { status: 404 });
    }

    // Check if skill is used in assessments
    const [{ count: assessCount }] = await query(
      'SELECT COUNT(*) as count FROM inteli_assessments_skills WHERE skill_id = ?', 
      [id]
    );
    
    if (assessCount > 0) {
      return NextResponse.json(
        { error: 'Cannot update skill that is used in assessments.' }, 
        { status: 409 }
      );
    }

    // Check if domain exists and belongs to the teacher's institution
    const [domain] = await query(
      'SELECT id FROM inteli_domains WHERE id = ? AND institution_id = ?', 
      [domain_id, institutionId]
    );
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found or does not belong to your institution.' }, 
        { status: 400 }
      );
    }

    // Check for duplicate name in the same domain
    const existing = await query(
      'SELECT id FROM inteli_skills WHERE name = ? AND domain_id = ? AND id != ?', 
      [name.trim(), domain_id, id]
    );
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A skill with this name already exists in this domain.' }, 
        { status: 409 }
      );
    }

    // Update skill
    await query(
      `UPDATE inteli_skills SET domain_id = ?, name = ?, description = ? WHERE id = ?`,
      [domain_id, name.trim(), description.trim(), id]
    );

    // Return updated skill
    const [updated] = await query(
      `SELECT 
        s.id, 
        s.institution_id, 
        s.domain_id, 
        s.name, 
        s.description, 
        i.name as institution_name, 
        d.name as domain_name,
        COUNT(DISTINCT as2.assessment_id) as assessments_count
      FROM inteli_skills s
      LEFT JOIN inteli_institutions i ON s.institution_id = i.id
      LEFT JOIN inteli_domains d ON s.domain_id = d.id
      LEFT JOIN inteli_assessments_skills as2 ON s.id = as2.skill_id
      WHERE s.id = ?
      GROUP BY s.id, s.institution_id, s.domain_id, s.name, s.description, i.name, d.name`,
      [id]
    );

    return NextResponse.json({ 
      skill: updated, 
      message: 'Skill updated successfully' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

// DELETE - Delete skill (only if not used in assessments)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const institutionId = request.headers.get('x-institution-id');
    
    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    // Check if skill exists and belongs to teacher's institution
    const [skill] = await query(
      'SELECT * FROM inteli_skills WHERE id = ? AND institution_id = ?', 
      [id, institutionId]
    );
    
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found.' }, { status: 404 });
    }

    // Check for related skill levels
    const [{ count: levelsCount }] = await query(
      'SELECT COUNT(*) as count FROM inteli_skills_levels WHERE skill_id = ?', 
      [id]
    );
    
    if (levelsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete skill with associated skill levels.' }, 
        { status: 409 }
      );
    }

    // Check for related assessments
    const [{ count: assessCount }] = await query(
      'SELECT COUNT(*) as count FROM inteli_assessments_skills WHERE skill_id = ?', 
      [id]
    );
    
    if (assessCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete skill associated with assessments.' }, 
        { status: 409 }
      );
    }

    // Delete skill
    await query('DELETE FROM inteli_skills WHERE id = ?', [id]);
    
    return NextResponse.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
} 