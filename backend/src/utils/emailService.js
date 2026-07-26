import nodemailer from 'nodemailer';
import getEmailConfig from '../config/email.js';
import escapeHtml from './escapeHtml.js';

const resolveRecipientName = (name, email) => {
  const trimmedName = String(name || '').trim();
  if (trimmedName) return trimmedName;

  const emailPrefix = String(email || '').split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return 'there';
};

const createTransporter = () => {
  const config = getEmailConfig();

  if (!config.isConfigured) {
    console.warn(
      `[Email] SMTP not configured. Missing: ${config.missing.join(', ') || 'SMTP settings'}`
    );
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  const config = getEmailConfig();
  const transporter = createTransporter();

  if (!transporter) {
    return { sent: false, devMode: true };
  }

  await transporter.sendMail({
    from: config.emailFrom,
    to,
    subject,
    html,
  });

  return { sent: true, devMode: false };
};

export const sendVerificationEmail = async ({ to, name, verificationUrl }) => {
  const config = getEmailConfig();
  const recipientName = resolveRecipientName(name, to);
  const safeName = escapeHtml(recipientName);
  const safeUrl = escapeHtml(verificationUrl);
  const subject = 'Verify your AI CareerBridge account';
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0b1c30;">Welcome to AI CareerBridge</h2>
      <p>Hi ${safeName},</p>
      <p>Thanks for signing up. Please verify your email address to activate your account.</p>
      <p style="margin: 24px 0;">
        <a href="${safeUrl}"
           style="background:#0058be;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;display:inline-block;">
          Verify Email
        </a>
      </p>
      <p>This link expires in ${config.verificationExpireMinutes} minutes.</p>
      <p>If you did not create this account, you can safely ignore this email.</p>
      <p style="color:#76777d;font-size:12px;">Or copy this link:<br/>${safeUrl}</p>
    </div>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] Verification link logged for development:');
    console.warn(verificationUrl);
    return { sent: false, devMode: true, verificationUrl };
  }

  try {
    await transporter.sendMail({
      from: config.emailFrom,
      to,
      subject,
      html,
    });
    console.log(`[Email] Verification email sent to ${to}`);
    return { sent: true, devMode: false };
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error.message);
    throw error;
  }
};

export const sendSocialWelcomeEmail = async ({ to, name, dashboardUrl }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const recipientName = resolveRecipientName(name, to);
  const safeName = escapeHtml(recipientName);
  const resolvedDashboardUrl = dashboardUrl || `${clientUrl}/dashboard`;
  const safeDashboardUrl = escapeHtml(resolvedDashboardUrl);
  const subject = 'Welcome to CareerBridge AI – Your Career Growth Journey Starts Here 🚀';
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0b1c30;">
      <div style="background: linear-gradient(135deg, #0058be 0%, #2170e4 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">CareerBridge AI</h1>
        <p style="color: #d8e2ff; margin: 8px 0 0; font-size: 14px;">Your Career Acceleration OS</p>
      </div>
      <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
        <h2 style="color: #0b1c30; margin-top: 0;">Welcome aboard, ${safeName}! 👋</h2>
        <p style="line-height: 1.6;">We're thrilled to have you join <strong>CareerBridge AI</strong> — your all-in-one platform for accelerating your career with intelligent automation and AI-powered tools.</p>
        <p style="line-height: 1.6;">Here's what you can do right away:</p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><strong>ATS Resume Builder</strong> — craft resumes optimized for applicant tracking systems</li>
          <li><strong>Resume Scanner</strong> — get instant feedback on resume quality and gaps</li>
          <li><strong>AI Job Matching</strong> — discover roles that fit your skills and goals</li>
          <li><strong>Interview Preparation</strong> — practice with AI mock interviews and skill assessments</li>
          <li><strong>LinkedIn Optimizer</strong> — strengthen your professional online presence</li>
        </ul>
        <p style="line-height: 1.6;">Head to your dashboard to start building your ATS-ready resume.</p>
        <p style="margin: 28px 0; text-align: center;">
          <a href="${safeDashboardUrl}"
             style="background:#0058be;color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block;font-weight:700;font-size:16px;">
            Go to Your Dashboard
          </a>
        </p>
        <p style="color: #76777d; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          If you have any questions, we're here to help. Welcome to your career growth journey!
        </p>
      </div>
      <p style="text-align: center; color: #76777d; font-size: 11px; margin-top: 16px;">
        © ${new Date().getFullYear()} CareerBridge AI. All rights reserved.
      </p>
    </div>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] Welcome email (dev mode) — dashboard link:');
    console.warn(resolvedDashboardUrl);
    return { sent: false, devMode: true, dashboardUrl: resolvedDashboardUrl };
  }

  try {
    await transporter.sendMail({
      from: getEmailConfig().emailFrom,
      to,
      subject,
      html,
    });
    console.log(`[Email] Welcome email sent to ${to}`);
    return { sent: true, devMode: false };
  } catch (error) {
    console.error(`[Email] Failed to send welcome email to ${to}:`, error.message);
    throw error;
  }
};

const formatLoginAlertTimestamp = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toUTCString();
  }

  return date.toUTCString();
};

export const sendLoginAlertEmail = async ({
  to,
  name,
  deviceLabel,
  ipAddress,
  signedInAt,
  securityUrl,
}) => {
  const recipientName = resolveRecipientName(name, to);
  const safeName = escapeHtml(recipientName);
  const safeDevice = escapeHtml(deviceLabel || 'Unknown device');
  const safeIp = escapeHtml(ipAddress || 'Unknown');
  const safeTime = escapeHtml(formatLoginAlertTimestamp(signedInAt));
  const safeSecurityUrl = escapeHtml(
    securityUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings/login-security`
  );
  const subject = 'New sign-in to your CareerBridge account';
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0b1c30;">
      <h2 style="color: #0b1c30;">New sign-in detected</h2>
      <p>Hi ${safeName},</p>
      <p>We noticed a sign-in to your CareerBridge account from an unfamiliar device or network.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Device:</strong> ${safeDevice}</p>
        <p style="margin:0 0 8px;"><strong>IP address:</strong> ${safeIp}</p>
        <p style="margin:0;"><strong>Time (UTC):</strong> ${safeTime}</p>
      </div>
      <p>If this was you, no action is needed.</p>
      <p>If you do not recognize this activity, change your password and review your active sessions.</p>
      <p style="margin: 24px 0;">
        <a href="${safeSecurityUrl}"
           style="background:#0058be;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;display:inline-block;">
          Review Login &amp; Security
        </a>
      </p>
      <p style="color:#76777d;font-size:12px;">You can turn off login alerts in Settings → Login &amp; Security.</p>
    </div>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] Login alert (dev mode):');
    console.warn(`  to: ${to}`);
    console.warn(`  device: ${deviceLabel || 'Unknown device'}`);
    console.warn(`  ip: ${ipAddress || 'Unknown'}`);
    console.warn(`  time: ${formatLoginAlertTimestamp(signedInAt)}`);
    console.warn(`  security: ${securityUrl}`);
    return { sent: false, devMode: true };
  }

  try {
    await transporter.sendMail({
      from: getEmailConfig().emailFrom,
      to,
      subject,
      html,
    });
    console.log(`[Email] Login alert sent to ${to}`);
    return { sent: true, devMode: false };
  } catch (error) {
    console.error('[Email] Failed to send login alert:', error.message);
    throw error;
  }
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const recipientName = resolveRecipientName(name, to);
  const safeName = escapeHtml(recipientName);
  const safeUrl = escapeHtml(resetUrl);
  const subject = 'Reset your AI CareerBridge password';
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0b1c30;">Password Reset Request</h2>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset your password. This link expires in 10 minutes.</p>
      <p style="margin: 24px 0;">
        <a href="${safeUrl}"
           style="background:#0058be;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p style="color:#76777d;font-size:12px;">Or copy this link:<br/>${safeUrl}</p>
    </div>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] Password reset link logged for development:');
    console.warn(resetUrl);
    return { sent: false, devMode: true, resetUrl };
  }

  try {
    await transporter.sendMail({
      from: getEmailConfig().emailFrom,
      to,
      subject,
      html,
    });
    console.log(`[Email] Password reset email sent to ${to}`);
    return { sent: true, devMode: false };
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error.message);
    throw error;
  }
};

export default sendEmail;
