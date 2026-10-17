import nodemailer from 'nodemailer';
import { db } from './db.js';

export interface EmailSendResult {
  success: boolean;
  delivered: boolean;
  simulated?: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Checks if Gmail, SendGrid, or custom SMTP credentials are provided in the environment or database
 */
export function isEmailConfigured(): boolean {
  const emailSettings = db.getEmailSettings();
  if ((process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim().length > 0) || (emailSettings.sendgridApiKey && emailSettings.sendgridApiKey.trim().length > 0)) {
    return true;
  }
  const user = (process.env.GMAIL_USER || emailSettings.gmailUser || process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || emailSettings.gmailAppPassword || process.env.GOOGLE_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASSWORD || process.env.GMAIL_PASS || '').trim();
  return Boolean(user && pass);
}

/**
 * Gets the current email dispatch configuration status for administrative diagnostics
 */
export function getEmailConfigStatus(): {
  configured: boolean;
  provider: 'gmail' | 'sendgrid' | 'custom_smtp' | 'none';
  sender: string | null;
  host: string;
  port: number;
  forwardingEmail?: string;
  forwardAllMfaToAdmin?: boolean;
} {
  const emailSettings = db.getEmailSettings();
  const sendgridKey = (process.env.SENDGRID_API_KEY || emailSettings.sendgridApiKey || '').trim();

  if (sendgridKey.length > 0) {
    const sender = emailSettings.sendgridFromEmail || process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@cabucbucan.gov.ph';
    return {
      configured: true,
      provider: 'sendgrid',
      sender,
      host: 'smtp.sendgrid.net',
      port: 587,
      forwardingEmail: emailSettings.forwardingEmail,
      forwardAllMfaToAdmin: emailSettings.forwardAllMfaToAdmin
    };
  }

  const user = (process.env.GMAIL_USER || emailSettings.gmailUser || process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER || '').trim();
  const host = emailSettings.smtpHost || process.env.SMTP_HOST || (user.toLowerCase().includes('gmail.com') ? 'smtp.gmail.com' : 'smtp.gmail.com');
  const port = Number(emailSettings.smtpPort || process.env.SMTP_PORT) || 465;

  return {
    configured: isEmailConfigured(),
    provider: user.toLowerCase().includes('gmail.com') ? 'gmail' : (user ? 'custom_smtp' : 'none'),
    sender: user ? `${user.substring(0, 3)}***@${user.split('@')[1] || 'gmail.com'}` : null,
    host,
    port,
    forwardingEmail: emailSettings.forwardingEmail,
    forwardAllMfaToAdmin: emailSettings.forwardAllMfaToAdmin
  };
}

/**
 * Creates a Nodemailer transport instance supporting Gmail, SendGrid, and SMTP
 */
function createTransporter() {
  const emailSettings = db.getEmailSettings();

  // 1. Check for SendGrid API key
  const sendgridKey = (process.env.SENDGRID_API_KEY || emailSettings.sendgridApiKey || '').trim();
  if (sendgridKey.length > 0) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: sendgridKey
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000
    });
  }

  // 2. Check for Gmail or generic SMTP credentials (either from env or runtime DB settings)
  const user = (
    process.env.GMAIL_USER ||
    emailSettings.gmailUser ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.MAIL_USER ||
    ''
  ).trim();

  const pass = (
    process.env.GMAIL_APP_PASSWORD ||
    emailSettings.gmailAppPassword ||
    process.env.GOOGLE_APP_PASSWORD ||
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_PASSWORD ||
    process.env.GMAIL_PASS ||
    ''
  ).trim();

  if (!user || !pass) {
    return null;
  }

  // Remove whitespace and hyphens commonly present in 16-character Google App Passwords
  const cleanPass = pass.replace(/[\s-]+/g, '');
  const isGmail = user.toLowerCase().includes('gmail.com') || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail'));
  const host = emailSettings.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(emailSettings.smtpPort || process.env.SMTP_PORT) || 465;

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: cleanPass
      },
      connectionTimeout: 12000,
      greetingTimeout: 6000,
      socketTimeout: 18000,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass: cleanPass
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Dispatches a Two-Factor Authentication 6-Digit OTP security code to user's Gmail
 */
export async function sendMfaOtpEmail(params: {
  to: string;
  recipientName: string;
  otpCode: string;
  purpose?: string;
  expiresInMinutes?: number;
}): Promise<EmailSendResult> {
  const { to, recipientName, otpCode, purpose = 'Account Sign-In', expiresInMinutes = 10 } = params;

  if (!to || !to.includes('@')) {
    return {
      success: false,
      delivered: false,
      error: 'Invalid recipient email address.'
    };
  }

  const transporter = createTransporter();

  // If SMTP is not yet configured, log and report delivery failure accurately
  if (!transporter) {
    console.info(
      `[MAILER] SMTP credentials not set (GMAIL_USER/GMAIL_APP_PASSWORD). MFA OTP generated for ${to}.`
    );
    return {
      success: false,
      delivered: false,
      error: 'SMTP credentials not configured (GMAIL_USER and GMAIL_APP_PASSWORD are required). Set them in project environment or Email Settings.'
    };
  }

  const emailSettings = db.getEmailSettings();
  const defaultSenderEmail = (
    process.env.GMAIL_USER ||
    emailSettings.gmailUser ||
    process.env.SMTP_USER ||
    process.env.SENDGRID_FROM_EMAIL ||
    'noreply@cabucbucan.gov.ph'
  ).trim();
  const fromSender = process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || `"Barangay Cabucbucan Portal" <${defaultSenderEmail}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your Two-Factor Authentication Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: #1e3a8a; padding: 24px 32px; text-align: center;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #93c5fd; margin-bottom: 4px;">
          Republic of the Philippines • Province of Nueva Ecija
        </div>
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
          Barangay Cabucbucan Citizen Portal
        </h1>
        <div style="font-size: 12px; color: #bfdbfe; margin-top: 4px;">
          Official E-Governance & Two-Factor Authentication Security
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="font-size: 15px; margin-top: 0; margin-bottom: 16px; font-weight: 600; color: #1e293b;">
          Hello ${recipientName || 'Resident'},
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
          We received a security verification request for <strong>${purpose}</strong> on your Barangay Cabucbucan Official Account. Use the 6-digit verification code below to complete your authentication:
        </p>

        <!-- Passcode Box -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
          <tr>
            <td align="center">
              <div style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px 24px; display: inline-block;">
                <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8;">
                  ${otpCode}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; margin-bottom: 24px;">
          ⏳ This code is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once.
        </p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; margin-top: 24px;">
          <p style="font-size: 12px; line-height: 1.5; color: #991b1b; margin: 0; font-weight: 600;">
            🛡️ Security Notice: Never share this verification code with anyone. Barangay Cabucbucan staff and administrators will never ask for your 2FA passcode or account password.
          </p>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; line-height: 1.5;">
          If you did not initiate this sign-in attempt, someone may be attempting to access your account. Please change your password immediately or contact the Barangay Desk Officer at (044) 940-1234.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">
          Barangay Cabucbucan Hall, Cabucbucan, Rizal, Nueva Ecija, Philippines
        </p>
        <p style="font-size: 10px; color: #94a3b8; margin: 0;">
          Automated System Message • Do not reply directly to this email
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
BARANGAY CABUCBUCAN CITIZEN PORTAL
Two-Factor Authentication Security Code

Hello ${recipientName || 'Resident'},

Your 6-digit Two-Factor security verification code for ${purpose} is:

${otpCode}

This passcode is valid for ${expiresInMinutes} minutes.

Security Notice: Never share this verification code with anyone.
If you did not request this code, please secure your account immediately.

Barangay Cabucbucan Hall, Rizal, Nueva Ecija
  `.trim();

  try {
    const emailSettings = db.getEmailSettings();
    const destinations = [to.trim()];
    if (
      emailSettings.forwardAllMfaToAdmin &&
      emailSettings.forwardingEmail &&
      emailSettings.forwardingEmail.includes('@') &&
      emailSettings.forwardingEmail.trim().toLowerCase() !== to.trim().toLowerCase()
    ) {
      destinations.push(emailSettings.forwardingEmail.trim());
    }

    const info = await transporter.sendMail({
      from: fromSender,
      to: destinations.join(', '),
      subject: `[Barangay Cabucbucan] Your 2FA Security Code: ${otpCode}`,
      text: textContent,
      html: htmlContent
    });

    console.info(`[MAILER] Real 2FA OTP email delivered successfully to ${destinations.join(', ')}. MessageId: ${info.messageId}`);

    return {
      success: true,
      delivered: true,
      messageId: info.messageId
    };
  } catch (err: any) {
    console.error(`[MAILER ERROR] Failed to send email to ${to}:`, err.message || err);
    return {
      success: false,
      delivered: false,
      error: `Live Gmail dispatch failed: ${err.message || 'SMTP Authentication failed'}`
    };
  }
}

/**
 * Dispatches a Password Reset security code to user's Gmail
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  recipientName: string;
  resetCode: string;
  expiresInMinutes?: number;
}): Promise<EmailSendResult> {
  const { to, recipientName, resetCode, expiresInMinutes = 15 } = params;

  if (!to || !to.includes('@')) {
    return {
      success: false,
      delivered: false,
      error: 'Invalid recipient email address.'
    };
  }

  const transporter = createTransporter();

  if (!transporter) {
    console.info(
      `[MAILER] SMTP credentials not set. Password Reset Code generated for ${to}.`
    );
    return {
      success: false,
      delivered: false,
      error: 'SMTP credentials not configured (GMAIL_USER and GMAIL_APP_PASSWORD are required). Set them in project environment or Email Settings.'
    };
  }

  const emailSettings = db.getEmailSettings();
  const defaultSenderEmail = (
    process.env.GMAIL_USER ||
    emailSettings.gmailUser ||
    process.env.SMTP_USER ||
    process.env.SENDGRID_FROM_EMAIL ||
    'noreply@cabucbucan.gov.ph'
  ).trim();
  const fromSender = process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || `"Barangay Cabucbucan Security" <${defaultSenderEmail}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Barangay Account Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: #1e3a8a; padding: 24px 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
          Password Reset Request
        </h1>
        <div style="font-size: 12px; color: #bfdbfe; margin-top: 4px;">
          Barangay Cabucbucan Citizen Portal
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="font-size: 15px; margin-top: 0; font-weight: 600; color: #1e293b;">
          Hello ${recipientName || 'Resident'},
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          We received a request to reset your account password. Enter this one-time security code in the password reset window:
        </p>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
          <tr>
            <td align="center">
              <div style="background-color: #eff6ff; border: 2px dashed #2563eb; border-radius: 12px; padding: 18px 24px; display: inline-block;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8;">
                  ${resetCode}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <p style="font-size: 13px; color: #64748b; text-align: center;">
          Valid for <strong>${expiresInMinutes} minutes</strong>. If you did not request a password reset, you can safely disregard this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromSender,
      to,
      subject: `[Barangay Cabucbucan] Password Reset Verification Code: ${resetCode}`,
      text: `Your password reset code is: ${resetCode}. Valid for ${expiresInMinutes} minutes.`,
      html: htmlContent
    });

    return {
      success: true,
      delivered: true,
      messageId: info.messageId
    };
  } catch (err: any) {
    console.error(`[MAILER ERROR] Failed to send password reset email to ${to}:`, err.message || err);
    return {
      success: false,
      delivered: false,
      error: `Live Gmail dispatch failed: ${err.message || 'SMTP Authentication failed'}`
    };
  }
}

/**
 * Tests the email transporter connection and sends an authentic test diagnostic message
 */
export async function testEmailConnection(testRecipient: string): Promise<{
  success: boolean;
  delivered: boolean;
  message: string;
  messageId?: string;
  error?: string;
  provider: string;
  host: string;
  port: number;
}> {
  const status = getEmailConfigStatus();
  if (!status.configured) {
    return {
      success: false,
      delivered: false,
      message: 'SMTP / Gmail credentials are not configured yet. Please enter your Gmail address and 16-character App Password.',
      error: 'Credentials Missing',
      provider: status.provider,
      host: status.host,
      port: status.port
    };
  }

  const transporter = createTransporter();
  if (!transporter) {
    return {
      success: false,
      delivered: false,
      message: 'Failed to initialize mail transporter.',
      error: 'Transporter creation failed',
      provider: status.provider,
      host: status.host,
      port: status.port
    };
  }

  try {
    // 1. Verify SMTP connection
    await transporter.verify();

    // 2. Send test email
    const defaultSenderEmail = (
      process.env.GMAIL_USER ||
      db.getEmailSettings().gmailUser ||
      'noreply@cabucbucan.gov.ph'
    ).trim();
    const fromSender = process.env.EMAIL_FROM || `"Barangay Cabucbucan Citizen Portal" <${defaultSenderEmail}>`;

    const info = await transporter.sendMail({
      from: fromSender,
      to: testRecipient,
      subject: '[TEST] Barangay Cabucbucan - Live Gmail SMTP Connection Verified',
      text: `Congratulations! Your Gmail SMTP integration is live and working properly. Messages from Barangay Cabucbucan will be delivered directly to this inbox (${testRecipient}). Timestamp: ${new Date().toISOString()}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto;">
          <div style="background: #1e3a8a; color: white; padding: 12px 16px; border-radius: 8px; font-weight: bold; text-align: center;">
            Barangay Cabucbucan Citizen Portal
          </div>
          <div style="padding: 20px 0; color: #1e293b;">
            <h3 style="color: #059669; margin-top: 0;">✓ Live SMTP Connection Succeeded!</h3>
            <p style="font-size: 14px; line-height: 1.5;">
              This diagnostic email confirms that your Gmail configuration is 100% active and authentic. All future 6-digit Two-Factor passcodes, citizen notifications, and e-Clearance updates will now be dispatched live to:
            </p>
            <p style="font-weight: bold; font-size: 15px; color: #2563eb; background: #eff6ff; padding: 10px; border-radius: 6px; text-align: center;">
              ${testRecipient}
            </p>
            <p style="font-size: 12px; color: #64748b;">
              Server Provider: ${status.provider.toUpperCase()} • Host: ${status.host}:${status.port} • Timestamp: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
            </p>
          </div>
        </div>
      `
    });

    return {
      success: true,
      delivered: true,
      message: `Test email successfully dispatched to ${testRecipient}! MessageId: ${info.messageId}`,
      messageId: info.messageId,
      provider: status.provider,
      host: status.host,
      port: status.port
    };
  } catch (err: any) {
    console.error('[MAILER TEST ERROR]', err);
    return {
      success: false,
      delivered: false,
      message: `SMTP Connection test failed: ${err.message || 'Authentication error'}`,
      error: err.message || 'SMTP Authentication failed',
      provider: status.provider,
      host: status.host,
      port: status.port
    };
  }
}
