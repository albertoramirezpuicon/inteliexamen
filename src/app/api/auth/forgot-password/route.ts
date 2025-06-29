import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST - Request password reset
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userQuery = `
      SELECT id, email, given_name, family_name, language_preference 
      FROM inteli_users 
      WHERE email = ?
    `;
    
    const users = await query(userQuery, [email]);
    
    if (!users || users.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'If the email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    const user = users[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    // Update user with reset token
    await query(
      'UPDATE inteli_users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id]
    );

    // Send email
    const userLanguage = user.language_preference || 'en';
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${userLanguage}/reset-password?token=${resetToken}`;
    
    const isSpanish = userLanguage === 'es';
    
    console.log('Password reset for user:', {
      email: user.email,
      name: `${user.given_name} ${user.family_name}`,
      language_preference: user.language_preference,
      userLanguage,
      isSpanish
    });
    
    const subject = isSpanish 
      ? 'Restablecer contraseña - Inteliexamen'
      : 'Reset Password - Inteliexamen';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isSpanish ? 'Restablecer Contraseña' : 'Reset Password'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #ffffff; color: #1976d2; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; border: 2px solid #1976d2; font-weight: bold; }
          .button:hover { background-color: #f5f5f5; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inteliexamen</h1>
            <p>${isSpanish ? 'Restablecer Contraseña' : 'Reset Password'}</p>
          </div>
          
          <div class="content">
            <p>${isSpanish ? 'Hola' : 'Hello'} ${user.given_name} ${user.family_name},</p>
            
            <p>${isSpanish 
              ? 'Has solicitado restablecer tu contraseña en Inteliexamen. Haz clic en el botón de abajo para crear una nueva contraseña:'
              : 'You have requested to reset your password for Inteliexamen. Click the button below to create a new password:'
            }</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">
                ${isSpanish ? 'Restablecer Contraseña' : 'Reset Password'}
              </a>
            </div>
            
            <div class="warning">
              <strong>${isSpanish ? 'Importante:' : 'Important:'}</strong>
              <ul>
                <li>${isSpanish 
                  ? 'Este enlace expirará en 1 hora por seguridad.'
                  : 'This link will expire in 1 hour for security reasons.'
                }</li>
                <li>${isSpanish 
                  ? 'Si no solicitaste este cambio, puedes ignorar este correo.'
                  : 'If you did not request this change, you can ignore this email.'
                }</li>
              </ul>
            </div>
            
            <p>${isSpanish 
              ? 'Si el botón no funciona, copia y pega este enlace en tu navegador:'
              : 'If the button doesn\'t work, copy and paste this link into your browser:'
            }</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            
            <p>${isSpanish 
              ? 'Saludos,<br>El equipo de Inteliexamen'
              : 'Best regards,<br>The Inteliexamen Team'
            }</p>
          </div>
          
          <div class="footer">
            <p>${isSpanish 
              ? 'Esta es una notificación automática de Inteliexamen. Por favor no respondas a este correo.'
              : 'This is an automated notification from Inteliexamen. Please do not reply to this email.'
            }</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: 'Inteliexamen <noreply@web.inteliexamen.com>',
      to: [user.email],
      subject: subject,
      html: htmlContent,
    });

    console.log('Password reset email sent:', result);
    
    return NextResponse.json(
      { message: isSpanish 
        ? 'Si el correo existe, se ha enviado un enlace para restablecer la contraseña.'
        : 'If the email exists, a password reset link has been sent.'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
} 