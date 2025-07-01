import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await request.json();
    const { id: assessmentId } = await params;

    console.log(`Attempt creation request - Assessment ID: ${assessmentId}, User ID: ${userId}`);

    if (!userId || !assessmentId) {
      return NextResponse.json(
        { error: 'User ID and Assessment ID are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this assessment through their groups
    const accessQuery = `
      SELECT DISTINCT a.id
      FROM inteli_assessments a
      INNER JOIN inteli_assessments_groups ag ON a.id = ag.assessment_id
      INNER JOIN inteli_users_groups ug ON ag.group_id = ug.group_id
      WHERE a.id = ? AND ug.user_id = ? AND a.status = 'Active'
      AND NOW() BETWEEN a.available_from AND a.available_until
    `;

    const accessResult = await query(accessQuery, [assessmentId, userId]);
    
    if (!accessResult || accessResult.length === 0) {
      console.log(`Access denied - Assessment ID: ${assessmentId}, User ID: ${userId}`);
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 404 }
      );
    }

    // Check if there's already an attempt for this user and assessment
    const existingAttemptQuery = `
      SELECT 
        id,
        assessment_id,
        user_id,
        final_grade,
        created_at,
        updated_at,
        completed_at,
        status
      FROM inteli_assessments_attempts
      WHERE assessment_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const existingAttemptResult = await query(existingAttemptQuery, [assessmentId, userId]);
    console.log(`Existing attempts found: ${existingAttemptResult ? existingAttemptResult.length : 0}`);

    if (existingAttemptResult && existingAttemptResult.length > 0) {
      console.log(`Returning existing attempt ID: ${existingAttemptResult[0].id}`);
      // Return existing attempt
      return NextResponse.json({
        attempt: existingAttemptResult[0]
      });
    }

    console.log(`Creating new attempt for Assessment ID: ${assessmentId}, User ID: ${userId}`);
    // Create new attempt only if no existing attempt found
    const createAttemptQuery = `
      INSERT INTO inteli_assessments_attempts (
        assessment_id,
        user_id,
        final_grade,
        created_at,
        updated_at,
        status
      ) VALUES (?, ?, 0.00, NOW(), NOW(), 'In progress')
    `;

    const createResult = await insertQuery(createAttemptQuery, [assessmentId, userId]);

    if (!createResult || !createResult.insertId) {
      throw new Error('Failed to create attempt');
    }

    console.log(`New attempt created with ID: ${createResult.insertId}`);

    // Get the created attempt
    const newAttemptQuery = `
      SELECT 
        id,
        assessment_id,
        user_id,
        final_grade,
        created_at,
        updated_at,
        completed_at,
        status
      FROM inteli_assessments_attempts
      WHERE id = ?
    `;

    const newAttemptResult = await query(newAttemptQuery, [createResult.insertId]);

    return NextResponse.json({
      attempt: newAttemptResult[0]
    });

  } catch (error) {
    console.error('Error creating attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    );
  }
} 