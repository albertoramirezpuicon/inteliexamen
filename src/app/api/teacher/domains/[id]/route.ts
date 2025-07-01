import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CountResult { count: number; }

// PUT - Update domain
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domainId = parseInt(id);
    
    if (isNaN(domainId)) {
      return NextResponse.json({ error: 'Invalid domain ID' }, { status: 400 });
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

    // Ensure teacher can only update domains from their institution
    if (parseInt(institution_id) !== parseInt(teacherInstitutionId)) {
      return NextResponse.json(
        { error: 'You can only update domains from your institution' },
        { status: 403 }
      );
    }

    // Check if domain exists and belongs to teacher's institution
    const existingDomain = await query(
      'SELECT id FROM inteli_domains WHERE id = ? AND institution_id = ?',
      [domainId, teacherInstitutionId]
    );

    if (existingDomain.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found or access denied' },
        { status: 404 }
      );
    }

    // Check if domain name already exists for this institution (excluding current domain)
    const duplicateDomains = await query(
      'SELECT id FROM inteli_domains WHERE name = ? AND institution_id = ? AND id != ?',
      [name.trim(), institution_id, domainId]
    );

    if (duplicateDomains.length > 0) {
      return NextResponse.json(
        { error: 'A domain with this name already exists in this institution' },
        { status: 409 }
      );
    }

    // Update domain
    await query(
      `UPDATE inteli_domains SET name = ?, description = ? WHERE id = ?`,
      [name.trim(), description || '', domainId]
    );

    // Get the updated domain with skills count
    const updatedDomains = await query(
      `SELECT 
        d.id,
        d.name,
        d.description,
        d.institution_id,
        i.name as institution_name,
        d.created_at,
        d.updated_at,
        COUNT(s.id) as skills_count
       FROM inteli_domains d
       LEFT JOIN inteli_institutions i ON d.institution_id = i.id
       LEFT JOIN inteli_skills s ON d.id = s.domain_id
       WHERE d.id = ?
       GROUP BY d.id, d.name, d.description, d.institution_id, i.name, d.created_at, d.updated_at`,
      [domainId]
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

// DELETE - Delete domain with assessment validation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domainId = parseInt(id);
    
    if (isNaN(domainId)) {
      return NextResponse.json({ error: 'Invalid domain ID' }, { status: 400 });
    }

    const teacherInstitutionId = request.headers.get('x-institution-id');

    if (!teacherInstitutionId) {
      return NextResponse.json(
        { error: 'Teacher institution ID not provided' },
        { status: 400 }
      );
    }

    // Check if domain exists and belongs to teacher's institution
    const existingDomain = await query(
      'SELECT id FROM inteli_domains WHERE id = ? AND institution_id = ?',
      [domainId, teacherInstitutionId]
    );

    if (existingDomain.length === 0) {
      return NextResponse.json(
        { error: 'Domain not found or access denied' },
        { status: 404 }
      );
    }

    // Check if domain has skills
    const skillsCount = await query(
      'SELECT COUNT(*) as count FROM inteli_skills WHERE domain_id = ?',
      [domainId]
    ) as CountResult[];

    if (skillsCount[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete domain that has skills. Please remove all skills first.' },
        { status: 400 }
      );
    }

    // Check if domain is used in any assessments (through skills)
    const assessmentCount = await query(
      `SELECT COUNT(DISTINCT a.id) as count
       FROM inteli_assessments a
       JOIN inteli_assessments_skills aas ON a.id = aas.assessment_id
       JOIN inteli_skills s ON aas.skill_id = s.id
       WHERE s.domain_id = ?`,
      [domainId]
    ) as CountResult[];

    if (assessmentCount[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete domain that is used in assessments. Please remove domain from assessments first.' },
        { status: 400 }
      );
    }

    // Delete domain
    await query('DELETE FROM inteli_domains WHERE id = ?', [domainId]);

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