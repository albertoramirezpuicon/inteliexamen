import { NextRequest, NextResponse } from 'next/server';
import { query, deleteQuery } from '@/lib/db';

// DELETE - Delete a specific attempt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attemptId = parseInt(id);
    
    if (isNaN(attemptId)) {
      return NextResponse.json(
        { error: 'Invalid attempt ID' },
        { status: 400 }
      );
    }

    // First, delete related results
    await query(
      'DELETE FROM inteli_assessments_results WHERE attempt_id = ?',
      [attemptId]
    );

    // Then delete the attempt
    const result = await deleteQuery(
      'DELETE FROM inteli_assessments_attempts WHERE id = ?',
      [attemptId]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Attempt deleted successfully',
      attempt_id: attemptId
    });
  } catch (error) {
    console.error('Error deleting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to delete attempt' },
      { status: 500 }
    );
  }
} 