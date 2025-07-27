import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// PUT - Limited update for assessments with attempts
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const institutionId = searchParams.get('institution_id');
    
    const {
      show_teacher_name,
      integrity_protection,
      available_until,
      dispute_period,
      status
    } = await request.json();

    // Validation
    if (!teacherId || !institutionId) {
      return NextResponse.json(
        { error: 'Teacher ID and Institution ID are required' },
        { status: 400 }
      );
    }

    if (!available_until || !dispute_period || !status) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate dispute period
    if (dispute_period < 3) {
      return NextResponse.json(
        { error: 'Dispute period must be at least 3 days' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['Active', 'Inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Check if assessment exists and belongs to the teacher
    const assessmentCheck = await query(
      'SELECT id, available_from FROM inteli_assessments WHERE id = ? AND institution_id = ? AND teacher_id = ?',
      [id, parseInt(institutionId), parseInt(teacherId)]
    );

    if (assessmentCheck.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found or access denied' },
        { status: 404 }
      );
    }

    const assessment = assessmentCheck[0];

    // Validate available_until date
    const availableFrom = new Date(assessment.available_from);
    const availableUntil = new Date(available_until);

    if (availableUntil <= availableFrom) {
      return NextResponse.json(
        { error: 'Available until date must be after available from date' },
        { status: 400 }
      );
    }

    // Check if assessment has attempts
    const attemptsResult = await query(
      'SELECT COUNT(*) as count FROM inteli_assessments_attempts WHERE assessment_id = ?',
      [id]
    );
    
    if (attemptsResult[0].count === 0) {
      return NextResponse.json(
        { error: 'This assessment has no attempts. Use the full edit form instead.' },
        { status: 400 }
      );
    }

    // Update only the allowed fields
    await query(
      `UPDATE inteli_assessments SET
        show_teacher_name = ?, 
        integrity_protection = ?, 
        available_until = ?, 
        dispute_period = ?, 
        status = ?
      WHERE id = ? AND institution_id = ? AND teacher_id = ?`,
      [
        show_teacher_name ? 1 : 0, 
        integrity_protection ? 1 : 0, 
        available_until, 
        dispute_period, 
        status,
        id, 
        parseInt(institutionId), 
        parseInt(teacherId)
      ]
    );

    return NextResponse.json({
      message: 'Assessment updated successfully',
      assessment_id: id
    });
  } catch (error) {
    console.error('Error updating assessment (limited):', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
} 