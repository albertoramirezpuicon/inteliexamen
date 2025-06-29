import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { resultId, studentArgument } = await request.json();

    if (!resultId || !studentArgument) {
      return NextResponse.json(
        { error: 'Result ID and student argument are required' },
        { status: 400 }
      );
    }

    // Validate that the result exists and belongs to the student
    const resultQuery = `
      SELECT ar.id, ar.attempt_id, aa.user_id, aa.status
      FROM inteli_assessments_results ar
      JOIN inteli_assessments_attempts aa ON ar.attempt_id = aa.id
      WHERE ar.id = ? AND aa.status = 'Completed'
    `;

    const results = await query(resultQuery, [resultId]);
    
    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'Result not found or attempt not completed' },
        { status: 404 }
      );
    }

    const result = results[0];
    
    // Check if a dispute already exists for this result
    const existingDisputeQuery = `
      SELECT id FROM inteli_assessments_disputes 
      WHERE result_id = ?
    `;
    
    const existingDisputes = await query(existingDisputeQuery, [resultId]);
    
    if (existingDisputes && existingDisputes.length > 0) {
      return NextResponse.json(
        { error: 'A dispute already exists for this result' },
        { status: 409 }
      );
    }

    // Check if dispute period has expired
    const attemptQuery = `
      SELECT aa.completed_at, a.dispute_period
      FROM inteli_assessments_attempts aa
      JOIN inteli_assessments a ON aa.assessment_id = a.id
      WHERE aa.id = ?
    `;
    
    const attempts = await query(attemptQuery, [result.attempt_id]);
    
    if (!attempts || attempts.length === 0) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    const attempt = attempts[0];
    const completedAt = new Date(attempt.completed_at);
    const disputeDeadline = new Date(completedAt.getTime() + attempt.dispute_period * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now > disputeDeadline) {
      return NextResponse.json(
        { error: 'Dispute period has expired' },
        { status: 400 }
      );
    }

    // Create the dispute
    const createDisputeQuery = `
      INSERT INTO inteli_assessments_disputes (
        result_id,
        status,
        student_argument,
        created_at,
        update_at
      ) VALUES (?, 'Pending', ?, NOW(), NOW())
    `;

    const disputeResult = await insertQuery(createDisputeQuery, [resultId, studentArgument]);

    // Get the created dispute
    const getDisputeQuery = `
      SELECT 
        id,
        result_id,
        status,
        student_argument,
        teacher_argument,
        created_at,
        update_at
      FROM inteli_assessments_disputes 
      WHERE id = ?
    `;

    const disputes = await query(getDisputeQuery, [disputeResult.insertId]);
    
    if (!disputes || disputes.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create dispute' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Dispute created successfully',
      dispute: disputes[0]
    });

  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 