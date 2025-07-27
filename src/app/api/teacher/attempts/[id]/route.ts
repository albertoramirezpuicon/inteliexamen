import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const attemptId = parseInt(id);
    const teacherId = request.headers.get('x-user-id');
    const institutionId = request.headers.get('x-institution-id');

    if (!teacherId || !institutionId) {
      return NextResponse.json(
        { error: 'Missing teacher or institution information' },
        { status: 400 }
      );
    }

    // Verify the attempt belongs to a teacher's assessment
    const attemptCheck = await query(`
      SELECT a.id 
      FROM inteli_assessments_attempts a
      JOIN inteli_assessments ass ON a.assessment_id = ass.id
      WHERE a.id = ? AND ass.teacher_id = ? AND ass.institution_id = ?
    `, [attemptId, teacherId, institutionId]);

    if (!attemptCheck || attemptCheck.length === 0) {
      return NextResponse.json(
        { error: 'Attempt not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the attempt and all related data
    await query('DELETE FROM inteli_assessments_attempts WHERE id = ?', [attemptId]);

    return NextResponse.json(
      { message: 'Attempt deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to delete attempt' },
      { status: 500 }
    );
  }
} 