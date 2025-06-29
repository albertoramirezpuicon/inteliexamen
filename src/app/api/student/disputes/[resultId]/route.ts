import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const { resultId: resultIdString } = await params;
    const resultId = parseInt(resultIdString);

    if (!resultId || isNaN(resultId)) {
      return NextResponse.json(
        { error: 'Invalid result ID' },
        { status: 400 }
      );
    }

    // Get the dispute for this result
    const disputeQuery = `
      SELECT 
        id,
        result_id,
        status,
        student_argument,
        teacher_argument,
        created_at,
        update_at
      FROM inteli_assessments_disputes 
      WHERE result_id = ?
    `;

    const disputes = await query(disputeQuery, [resultId]);
    
    if (!disputes || disputes.length === 0) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      dispute: disputes[0]
    });

  } catch (error) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 