/**
 * Email Service
 *
 * Uses Nodemailer with Gmail SMTP (free with App Passwords).
 *
 * Required environment variables:
 *   SMTP_HOST    → e.g. smtp.gmail.com
 *   SMTP_PORT    → e.g. 587
 *   SMTP_USER    → your Gmail address
 *   SMTP_PASS    → Gmail App Password (NOT your login password)
 *   SMTP_FROM    → e.g. "RSA Secure Chat <noreply@rsachat.com>"
 *
 * If SMTP is not configured, the service falls back to logging
 * the reset URL to the console (useful for development).
 */

const nodemailer = require("nodemailer");
const logger = require("../utils/logger.util");

const isSmtpConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

/**
 * Create the Nodemailer transporter.
 * Returns null if SMTP is not configured.
 */
const createTransporter = () => {
  if (!isSmtpConfigured()) {
    logger.warn("[Email] SMTP not configured — emails will be logged to console.");
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send a password-reset email to the user.
 *
 * @param {string} to        – Recipient email address.
 * @param {string} resetToken – Plain (unhashed) reset token.
 * @param {string} resetUrl   – Full URL the user should visit to reset.
 */
const sendPasswordResetEmail = async (to, resetToken, resetUrl) => {
  const subject = "🔐 RSA Secure Chat — Password Reset Request";
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e;">Password Reset</h2>
      <p>You requested a password reset for your RSA Secure Chat account.</p>
      <p>Click the button below to reset your password. This link expires in <strong>10 minutes</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="background-color: #6c63ff; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 6px; font-weight: bold;
                  display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <code style="word-break: break-all;">${resetUrl}</code>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"/>
      <p style="color: #999; font-size: 12px;">
        If you did not request this reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    // Dev fallback: log to console
    logger.info("════════════════════════════════════════");
    logger.info("[Email] PASSWORD RESET (dev mode)");
    logger.info(`  To:    ${to}`);
    logger.info(`  Token: ${resetToken}`);
    logger.info(`  URL:   ${resetUrl}`);
    logger.info("════════════════════════════════════════");
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"RSA Secure Chat" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[Email] Password reset email sent to ${to} (messageId: ${info.messageId})`);
  } catch (err) {
    logger.error(`[Email] Failed to send reset email: ${err.message}`);
    throw new Error("Failed to send password reset email. Please try again later.");
  }
};

module.exports = {
  sendPasswordResetEmail,
  isSmtpConfigured,
};
