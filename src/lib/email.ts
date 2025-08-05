import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface DisputeEmailData {
  studentName: string;
  studentEmail: string;
  assessmentName: string;
  skillName: string;
  oldStatus: string;
  newStatus: string;
  teacherResponse?: string;
  teacherName: string;
  teacherEmail: string;
}

export interface DisputeSubmissionEmailData {
  studentName: string;
  studentEmail: string;
  teacherName: string;
  teacherEmail: string;
  assessmentName: string;
  skillNames: string[];
  studentArgument: string;
  disputeCount: number;
}

export async function sendDisputeStatusEmail(data: DisputeEmailData) {
  try {
    const { studentName, studentEmail, assessmentName, skillName, oldStatus, newStatus, teacherResponse, teacherName, teacherEmail } = data;

    const subject = `Dispute Status Updated - ${assessmentName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dispute Status Updated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; }
          .status-pending { background-color: #fff3cd; color: #856404; }
          .status-review { background-color: #cce5ff; color: #004085; }
          .status-solved { background-color: #d4edda; color: #155724; }
          .status-rejected { background-color: #f8d7da; color: #721c24; }
          .teacher-response { background-color: white; padding: 15px; border-left: 4px solid #1976d2; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inteliexamen</h1>
            <p>Dispute Status Update</p>
          </div>
          
          <div class="content">
            <p>Dear ${studentName},</p>
            
            <p>Your dispute for the assessment <strong>${assessmentName}</strong> has been reviewed.</p>
            
            <h3>Dispute Details:</h3>
            <ul>
              <li><strong>Assessment:</strong> ${assessmentName}</li>
              <li><strong>Skill:</strong> ${skillName}</li>
              <li><strong>Previous Status:</strong> <span class="status-badge status-${oldStatus.toLowerCase().replace(' ', '-')}">${oldStatus}</span></li>
              <li><strong>New Status:</strong> <span class="status-badge status-${newStatus.toLowerCase().replace(' ', '-')}">${newStatus}</span></li>
              <li><strong>Reviewed by:</strong> ${teacherName}</li>
            </ul>
            
            ${teacherResponse ? `
            <h3>Teacher's Response:</h3>
            <div class="teacher-response">
              ${teacherResponse}
            </div>
            ` : ''}
            
            <p>You can view the full details of your dispute and assessment results by logging into your student dashboard.</p>
            
            <p>If you have any questions about this decision, please reply to this email or contact your teacher directly.</p>
            
            <p>Best regards,<br>
            The Inteliexamen Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from Inteliexamen. Please do not reply to this email address.</p>
            <p>If you need assistance, please contact your teacher or institution administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: 'Inteliexamen <disputes@web.inteliexamen.com>', // You can change this to: 'noreply@web.inteliexamen.com', 'support@web.inteliexamen.com', etc.
      to: [studentEmail],
      replyTo: teacherEmail, // Use teacher's email as reply-to
      subject: subject,
      html: htmlContent,
    });

    console.log('Dispute status email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending dispute status email:', error);
    throw error;
  }
}

export async function sendDisputeSubmissionEmails(data: DisputeSubmissionEmailData) {
  try {
    const { studentName, studentEmail, teacherName, teacherEmail, assessmentName, skillNames, studentArgument, disputeCount } = data;

    // Email to student (confirmation)
    const studentSubject = `Dispute Submitted - ${assessmentName}`;
    const studentHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dispute Submitted</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .skills-list { background-color: white; padding: 15px; border-left: 4px solid #1976d2; margin: 15px 0; }
          .argument { background-color: white; padding: 15px; border-left: 4px solid #ff9800; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inteliexamen</h1>
            <p>Dispute Submitted Successfully</p>
          </div>
          
          <div class="content">
            <p>Dear ${studentName},</p>
            
            <p>Your dispute for the assessment <strong>${assessmentName}</strong> has been submitted successfully.</p>
            
            <h3>Dispute Details:</h3>
            <ul>
              <li><strong>Assessment:</strong> ${assessmentName}</li>
              <li><strong>Skills Disputed:</strong> ${disputeCount} skill${disputeCount > 1 ? 's' : ''}</li>
              <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            
            <div class="skills-list">
              <h4>Skills Being Disputed:</h4>
              <ul>
                ${skillNames.map(skill => `<li>${skill}</li>`).join('')}
              </ul>
            </div>
            
            <div class="argument">
              <h4>Your Argument:</h4>
              <p>${studentArgument}</p>
            </div>
            
            <p>Your teacher, ${teacherName}, has been notified and will review your dispute. You will receive an email notification once they respond.</p>
            
            <p>You can track the status of your dispute by logging into your student dashboard.</p>
            
            <p>Best regards,<br>
            The Inteliexamen Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from Inteliexamen. Please do not reply to this email address.</p>
            <p>If you need assistance, please contact your teacher or institution administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email to teacher (notification)
    const teacherSubject = `New Dispute Submitted - ${assessmentName}`;
    const teacherHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Dispute Submitted</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .skills-list { background-color: white; padding: 15px; border-left: 4px solid #1976d2; margin: 15px 0; }
          .argument { background-color: white; padding: 15px; border-left: 4px solid #ff9800; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inteliexamen</h1>
            <p>New Dispute Requires Review</p>
          </div>
          
          <div class="content">
            <p>Dear ${teacherName},</p>
            
            <p>A new dispute has been submitted for the assessment <strong>${assessmentName}</strong>.</p>
            
            <h3>Dispute Details:</h3>
            <ul>
              <li><strong>Assessment:</strong> ${assessmentName}</li>
              <li><strong>Student:</strong> ${studentName}</li>
              <li><strong>Skills Disputed:</strong> ${disputeCount} skill${disputeCount > 1 ? 's' : ''}</li>
              <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            
            <div class="skills-list">
              <h4>Skills Being Disputed:</h4>
              <ul>
                ${skillNames.map(skill => `<li>${skill}</li>`).join('')}
              </ul>
            </div>
            
            <div class="argument">
              <h4>Student's Argument:</h4>
              <p>${studentArgument}</p>
            </div>
            
            <p>Please log into your teacher dashboard to review this dispute and provide a response.</p>
            
            <p>Best regards,<br>
            The Inteliexamen Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from Inteliexamen. Please do not reply to this email address.</p>
            <p>If you need assistance, please contact your institution administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to student
    const studentResult = await resend.emails.send({
      from: 'Inteliexamen <disputes@web.inteliexamen.com>',
      to: [studentEmail],
      subject: studentSubject,
      html: studentHtmlContent,
    });

    // Send email to teacher
    const teacherResult = await resend.emails.send({
      from: 'Inteliexamen <disputes@web.inteliexamen.com>',
      to: [teacherEmail],
      subject: teacherSubject,
      html: teacherHtmlContent,
    });

    console.log('Dispute submission emails sent:', { student: studentResult, teacher: teacherResult });
    return { student: studentResult, teacher: teacherResult };
  } catch (error) {
    console.error('Error sending dispute submission emails:', error);
    throw error;
  }
} 