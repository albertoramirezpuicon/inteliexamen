import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get groups for a specific assessment (restricted to teacher's assessments)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id);
    
    // Get user info from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userInstitutionId = request.headers.get('x-institution-id');
    
    if (!userId || !userInstitutionId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // First, verify the assessment belongs to the teacher
    const assessmentCheck = await query(
      `SELECT id, institution_id FROM inteli_assessments 
       WHERE id = ? AND institution_id = ? AND teacher_id = ?`,
      [assessmentId, parseInt(userInstitutionId), parseInt(userId)]
    );

    if (assessmentCheck.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 404 }
      );
    }

    // Get available groups (groups from the same institution that are not associated with this assessment)
    const availableGroups = await query(
      `SELECT g.id, g.name, g.description
       FROM inteli_groups g
       WHERE g.institution_id = ?
       AND g.id NOT IN (
         SELECT ag.group_id 
         FROM inteli_assessments_groups ag 
         WHERE ag.assessment_id = ?
       )
       ORDER BY g.name ASC`,
      [parseInt(userInstitutionId), assessmentId]
    );

    // Get currently associated groups
    const associatedGroups = await query(
      `SELECT g.id, g.name, g.description
       FROM inteli_groups g
       JOIN inteli_assessments_groups ag ON g.id = ag.group_id
       WHERE ag.assessment_id = ?
       ORDER BY g.name ASC`,
      [assessmentId]
    );

    return NextResponse.json({
      availableGroups,
      associatedGroups,
      institutionId: parseInt(userInstitutionId)
    });
  } catch (error) {
    console.error('Error fetching assessment groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST - Add groups to assessment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id);
    const { groupIds } = await request.json();
    
    // Get user info from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userInstitutionId = request.headers.get('x-institution-id');
    
    if (!userId || !userInstitutionId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return NextResponse.json(
        { error: 'Group IDs are required' },
        { status: 400 }
      );
    }

    // First, verify the assessment belongs to the teacher
    const assessmentCheck = await query(
      `SELECT id FROM inteli_assessments 
       WHERE id = ? AND institution_id = ? AND teacher_id = ?`,
      [assessmentId, parseInt(userInstitutionId), parseInt(userId)]
    );

    if (assessmentCheck.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 404 }
      );
    }

    // Verify all groups belong to the teacher's institution
    const groupsCheck = await query(
      `SELECT id FROM inteli_groups 
       WHERE id IN (${groupIds.map(() => '?').join(',')}) 
       AND institution_id = ?`,
      [...groupIds, parseInt(userInstitutionId)]
    );

    if (groupsCheck.length !== groupIds.length) {
      return NextResponse.json(
        { error: 'One or more groups not found or access denied' },
        { status: 400 }
      );
    }

    // Check for existing associations to avoid duplicates
    const existingAssociations = await query(
      `SELECT group_id FROM inteli_assessments_groups 
       WHERE assessment_id = ? AND group_id IN (${groupIds.map(() => '?').join(',')})`,
      [assessmentId, ...groupIds]
    );

    const existingGroupIds = existingAssociations.map((row: any) => row.group_id);
    const newGroupIds = groupIds.filter((id: number) => !existingGroupIds.includes(id));

    if (newGroupIds.length === 0) {
      return NextResponse.json({
        message: 'All groups are already associated with this assessment',
        addedAssociations: 0
      });
    }

    // Insert new associations
    let addedCount = 0;
    for (const groupId of newGroupIds) {
      await query(
        'INSERT INTO inteli_assessments_groups (assessment_id, group_id) VALUES (?, ?)',
        [assessmentId, groupId]
      );
      addedCount++;
    }

    return NextResponse.json({
      message: `Added ${addedCount} group(s) to assessment`,
      addedAssociations: addedCount
    });
  } catch (error) {
    console.error('Error adding groups to assessment:', error);
    return NextResponse.json(
      { error: 'Failed to add groups to assessment' },
      { status: 500 }
    );
  }
}

// DELETE - Remove groups from assessment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const groupIdsParam = searchParams.get('groupIds');
    
    if (!groupIdsParam) {
      return NextResponse.json(
        { error: 'Group IDs are required' },
        { status: 400 }
      );
    }

    const groupIds = groupIdsParam.split(',').map(id => parseInt(id));
    
    // Get user info from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userInstitutionId = request.headers.get('x-institution-id');
    
    if (!userId || !userInstitutionId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // First, verify the assessment belongs to the teacher
    const assessmentCheck = await query(
      `SELECT id FROM inteli_assessments 
       WHERE id = ? AND institution_id = ? AND teacher_id = ?`,
      [assessmentId, parseInt(userInstitutionId), parseInt(userId)]
    );

    if (assessmentCheck.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 404 }
      );
    }

    // Verify all groups belong to the teacher's institution
    const groupsCheck = await query(
      `SELECT id FROM inteli_groups 
       WHERE id IN (${groupIds.map(() => '?').join(',')}) 
       AND institution_id = ?`,
      [...groupIds, parseInt(userInstitutionId)]
    );

    if (groupsCheck.length !== groupIds.length) {
      return NextResponse.json(
        { error: 'One or more groups not found or access denied' },
        { status: 400 }
      );
    }

    // Remove associations
    const result = await query(
      `DELETE FROM inteli_assessments_groups 
       WHERE assessment_id = ? AND group_id IN (${groupIds.map(() => '?').join(',')})`,
      [assessmentId, ...groupIds]
    );

    return NextResponse.json({
      message: `Removed ${result.affectedRows} group(s) from assessment`,
      removedAssociations: result.affectedRows
    });
  } catch (error) {
    console.error('Error removing groups from assessment:', error);
    return NextResponse.json(
      { error: 'Failed to remove groups from assessment' },
      { status: 500 }
    );
  }
} 