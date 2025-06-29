import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Retrieve groups associated with an assessment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('GET /api/admin/assessments/[id]/groups - Starting request');
    
    const { id } = await params;
    console.log('Assessment ID from params:', id);
    
    const assessmentId = parseInt(id);
    console.log('Parsed assessment ID:', assessmentId);
    
    if (isNaN(assessmentId)) {
      console.log('Invalid assessment ID:', id);
      return NextResponse.json({ error: 'Invalid assessment ID' }, { status: 400 });
    }

    console.log('Fetching assessment with ID:', assessmentId);
    
    // Get the assessment to check institution
    const [assessment] = await query(
      `SELECT a.id, a.name, a.institution_id, i.name as institution_name
       FROM inteli_assessments a
       LEFT JOIN inteli_institutions i ON a.institution_id = i.id
       WHERE a.id = ?`,
      [assessmentId]
    );

    console.log('Assessment query result:', assessment);

    if (!assessment) {
      console.log('Assessment not found for ID:', assessmentId);
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    console.log('Fetching associated groups for assessment:', assessmentId);
    
    // Get associated groups
    const associatedGroups = await query(
      `SELECT g.id, g.name, g.description, g.institution_id
       FROM inteli_assessments_groups ag
       JOIN inteli_groups g ON ag.group_id = g.id
       WHERE ag.assessment_id = ?
       ORDER BY g.name ASC`,
      [assessmentId]
    );

    console.log('Associated groups query result:', associatedGroups);

    console.log('Fetching available groups for institution:', assessment.institution_id);
    
    // Get all available groups from the same institution
    const availableGroups = await query(
      `SELECT id, name, description, institution_id
       FROM inteli_groups
       WHERE institution_id = ?
       ORDER BY name ASC`,
      [assessment.institution_id]
    );

    console.log('Available groups query result:', availableGroups);

    const response = {
      associatedGroups,
      availableGroups,
      institutionId: assessment.institution_id
    };

    console.log('Sending response:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/admin/assessments/[id]/groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add groups to an assessment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = parseInt(id);
    
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: 'Invalid assessment ID' }, { status: 400 });
    }

    const { groupIds } = await request.json();

    if (!Array.isArray(groupIds)) {
      return NextResponse.json({ error: 'groupIds must be an array' }, { status: 400 });
    }

    // Get the assessment to check institution
    const [assessment] = await query(
      `SELECT id, institution_id FROM inteli_assessments WHERE id = ?`,
      [assessmentId]
    );

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Verify all groups belong to the same institution
    const groups = await query(
      `SELECT id FROM inteli_groups 
       WHERE id IN (${groupIds.map(() => '?').join(',')}) 
       AND institution_id = ?`,
      [...groupIds, assessment.institution_id]
    );

    if (groups.length !== groupIds.length) {
      return NextResponse.json({ error: 'Some groups do not belong to the same institution' }, { status: 400 });
    }

    // Add associations (additive - won't duplicate existing ones)
    let addedCount = 0;
    for (const groupId of groupIds) {
      const [existing] = await query(
        `SELECT id FROM inteli_assessments_groups 
         WHERE assessment_id = ? AND group_id = ?`,
        [assessmentId, groupId]
      );

      if (!existing) {
        await query(
          `INSERT INTO inteli_assessments_groups (assessment_id, group_id) 
           VALUES (?, ?)`,
          [assessmentId, groupId]
        );
        addedCount++;
      }
    }

    return NextResponse.json({
      message: 'Groups associated successfully',
      addedAssociations: addedCount
    });
  } catch (error) {
    console.error('Error associating groups with assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove groups from an assessment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = parseInt(id);
    
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: 'Invalid assessment ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const groupIds = searchParams.get('groupIds');

    if (!groupIds) {
      return NextResponse.json({ error: 'groupIds parameter is required' }, { status: 400 });
    }

    const groupIdArray = groupIds.split(',').map(id => parseInt(id.trim()));

    if (groupIdArray.some(isNaN)) {
      return NextResponse.json({ error: 'Invalid group IDs' }, { status: 400 });
    }

    // Remove associations
    const result = await query(
      `DELETE FROM inteli_assessments_groups 
       WHERE assessment_id = ? AND group_id IN (${groupIdArray.map(() => '?').join(',')})`,
      [assessmentId, ...groupIdArray]
    );

    return NextResponse.json({
      message: 'Groups removed successfully',
      removedAssociations: result.affectedRows || 0
    });
  } catch (error) {
    console.error('Error removing groups from assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 