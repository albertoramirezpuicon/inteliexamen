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