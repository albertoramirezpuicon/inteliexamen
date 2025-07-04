import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get conversation for a specific dispute
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const { disputeId } = await params;
    const disputeIdNum = parseInt(disputeId);
    const teacherId = request.headers.get('x-user-id');
    const institutionId = request.headers.get('x-institution-id');

    if (!disputeIdNum) {
      return NextResponse.json({ error: 'Dispute ID is required' }, { status: 400 });
    }

    if (!teacherId || !institutionId) {
      return NextResponse.json(
        { error: 'Missing teacher or institution information' },
        { status: 400 }
      );
    }

    // Verify the dispute belongs to a teacher's assessment
    const disputeCheck = await query(`
      SELECT d.id 
      FROM inteli_disputes d
      JOIN inteli_assessments_results r ON d.result_id = r.id
      JOIN inteli_assessments_attempts a ON r.attempt_id = a.id
      JOIN inteli_assessments ass ON a.assessment_id = ass.id
      WHERE d.id = ? AND ass.teacher_id = ? AND ass.institution_id = ?
    `, [disputeIdNum, teacherId, institutionId]);

    if (!disputeCheck || disputeCheck.length === 0) {
      return NextResponse.json(
        { error: 'Dispute not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch conversation for the dispute
    const conversation = await query(
      `SELECT 
        c.id,
        c.message_type,
        c.message_text,
        c.created_at
      FROM inteli_disputes_conversation c
      WHERE c.dispute_id = ?
      ORDER BY c.created_at ASC`,
      [disputeIdNum]
    );

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching dispute conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch dispute conversation' }, { status: 500 });
  }
} 