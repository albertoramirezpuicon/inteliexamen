import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendDisputeStatusEmail } from '@/lib/email';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const { disputeId } = await params;
    const body = await request.json();
    const { teacher_argument, status } = body;

    console.log('Updating dispute:', disputeId, body);

    // Validate required fields
    if (!teacher_argument || !status) {
      return NextResponse.json(
        { error: 'Teacher argument and status are required' },
        { status: 400 }
      );
    }

    // Get current dispute data before update
    const getCurrentDisputeQuery = `
      SELECT 
        d.id,
        d.result_id,
        d.status as current_status,
        d.student_argument,
        d.teacher_argument,
        d.created_at,
        d.update_at,
        CONCAT(u.given_name, ' ', u.family_name) as student_name,
        u.email as student_email,
        s.name as skill_name,
        sl.label as current_skill_level,
        ar.feedback as current_feedback,
        ar.skill_level_id,
        ar.skill_id,
        a.name as assessment_name,
        CONCAT(t.given_name, ' ', t.family_name) as teacher_name,
        t.email as teacher_email
      FROM inteli_assessments_disputes d
      JOIN inteli_assessments_results ar ON d.result_id = ar.id
      JOIN inteli_assessments_attempts aa ON ar.attempt_id = aa.id
      JOIN inteli_assessments a ON aa.assessment_id = a.id
      JOIN inteli_users u ON aa.user_id = u.id
      JOIN inteli_users t ON a.teacher_id = t.id
      JOIN inteli_skills s ON ar.skill_id = s.id
      JOIN inteli_skills_levels sl ON ar.skill_level_id = sl.id
      WHERE d.id = ?
    `;

    const currentDisputes = await query(getCurrentDisputeQuery, [disputeId]);
    if (!currentDisputes || currentDisputes.length === 0) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    const currentDispute = currentDisputes[0];
    const oldStatus = currentDispute.current_status;

    // Update the dispute
    const updateQuery = `
      UPDATE inteli_assessments_disputes 
      SET teacher_argument = ?, status = ?, update_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const updateResult = await query(updateQuery, [teacher_argument, status, disputeId]);
    console.log('Update result:', updateResult);

    // Send email notification if status changed
    if (oldStatus !== status) {
      try {
        await sendDisputeStatusEmail({
          studentName: currentDispute.student_name,
          studentEmail: currentDispute.student_email,
          assessmentName: currentDispute.assessment_name,
          skillName: currentDispute.skill_name,
          oldStatus: oldStatus,
          newStatus: status,
          teacherResponse: teacher_argument,
          teacherName: currentDispute.teacher_name,
          teacherEmail: currentDispute.teacher_email
        });
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    // Get the updated dispute
    const getDisputeQuery = `
      SELECT 
        d.id,
        d.result_id,
        d.status,
        d.student_argument,
        d.teacher_argument,
        d.created_at,
        d.update_at,
        CONCAT(u.given_name, ' ', u.family_name) as student_name,
        u.email as student_email,
        s.name as skill_name,
        sl.label as current_skill_level,
        ar.feedback as current_feedback,
        ar.skill_level_id,
        ar.skill_id
      FROM inteli_assessments_disputes d
      JOIN inteli_assessments_results ar ON d.result_id = ar.id
      JOIN inteli_assessments_attempts aa ON ar.attempt_id = aa.id
      JOIN inteli_users u ON aa.user_id = u.id
      JOIN inteli_skills s ON ar.skill_id = s.id
      JOIN inteli_skills_levels sl ON ar.skill_level_id = sl.id
      WHERE d.id = ?
    `;

    const disputes = await query(getDisputeQuery, [disputeId]);

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
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to update dispute' },
      { status: 500 }
    );
  }
} 