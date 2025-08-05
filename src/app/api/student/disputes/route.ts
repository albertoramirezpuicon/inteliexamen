import { NextRequest, NextResponse } from 'next/server';
import { query, insertQuery } from '@/lib/db';
import { sendDisputeSubmissionEmails } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { resultIds, studentArgument } = await request.json();

    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0 || !studentArgument) {
      return NextResponse.json(
        { error: 'Result IDs array and student argument are required' },
        { status: 400 }
      );
    }

    // Validate that all results exist and belong to the student
    const placeholders = resultIds.map(() => '?').join(',');
    const resultQuery = `
      SELECT ar.id, ar.attempt_id, aa.user_id, aa.status
      FROM inteli_assessments_results ar
      JOIN inteli_assessments_attempts aa ON ar.attempt_id = aa.id
      WHERE ar.id IN (${placeholders}) AND aa.status = 'Completed'
    `;

    const results = await query(resultQuery, resultIds);
    
    if (!results || results.length !== resultIds.length) {
      return NextResponse.json(
        { error: 'One or more results not found or attempts not completed' },
        { status: 404 }
      );
    }

    // Check if all results belong to the same attempt
    const attemptIds = [...new Set(results.map(r => r.attempt_id))];
    if (attemptIds.length > 1) {
      return NextResponse.json(
        { error: 'All disputed results must belong to the same attempt' },
        { status: 400 }
      );
    }

    const result = results[0]; // Use first result for attempt validation
    
    // Check if disputes already exist for any of these results
    const existingDisputeQuery = `
      SELECT result_id FROM inteli_assessments_disputes 
      WHERE result_id IN (${placeholders})
    `;
    
    const existingDisputes = await query(existingDisputeQuery, resultIds);
    
    if (existingDisputes && existingDisputes.length > 0) {
      const disputedResultIds = existingDisputes.map(d => d.result_id);
      return NextResponse.json(
        { error: `Disputes already exist for results: ${disputedResultIds.join(', ')}` },
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

    // Create disputes for all selected results
    const createDisputeQuery = `
      INSERT INTO inteli_assessments_disputes (
        result_id,
        status,
        student_argument,
        created_at,
        update_at
      ) VALUES (?, 'Pending', ?, NOW(), NOW())
    `;

    const createdDisputes = [];
    
    for (const resultId of resultIds) {
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
      
      if (disputes && disputes.length > 0) {
        createdDisputes.push(disputes[0]);
      }
    }
    
    if (createdDisputes.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create disputes' },
        { status: 500 }
      );
    }

    // Send email notifications
    try {
      // Get assessment and user information for emails
      const assessmentInfoQuery = `
        SELECT 
          a.name as assessment_name,
          a.teacher_given_name,
          a.teacher_family_name,
          u.email as student_email,
          u.given_name as student_given_name,
          u.family_name as student_family_name,
          t.email as teacher_email
        FROM inteli_assessments a
        JOIN inteli_assessments_attempts aa ON a.id = aa.assessment_id
        JOIN inteli_users u ON aa.user_id = u.id
        JOIN inteli_users t ON a.teacher_id = t.id
        WHERE aa.id = ?
      `;

      const assessmentInfo = await query(assessmentInfoQuery, [result.attempt_id]);
      
      if (assessmentInfo && assessmentInfo.length > 0) {
        const info = assessmentInfo[0];
        
        // Get skill names for the disputed results
        const skillNamesQuery = `
          SELECT s.name as skill_name
          FROM inteli_assessments_results ar
          JOIN inteli_skills s ON ar.skill_id = s.id
          WHERE ar.id IN (${placeholders})
        `;
        
        const skillNamesResult = await query(skillNamesQuery, resultIds);
        const skillNames = skillNamesResult.map((row: any) => row.skill_name);

        // Send email notifications
        await sendDisputeSubmissionEmails({
          studentName: `${info.student_given_name} ${info.student_family_name}`,
          studentEmail: info.student_email,
          teacherName: `${info.teacher_given_name} ${info.teacher_family_name}`,
          teacherEmail: info.teacher_email,
          assessmentName: info.assessment_name,
          skillNames: skillNames,
          studentArgument: studentArgument,
          disputeCount: resultIds.length
        });
      }
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError);
      // Don't fail the dispute creation if email fails
    }

    return NextResponse.json({
      message: 'Disputes created successfully',
      disputes: createdDisputes,
      dispute: createdDisputes[0] // Return first dispute for backward compatibility
    });

  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 