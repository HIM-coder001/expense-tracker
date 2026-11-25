/**
 * Nodemailer transporter + email helper.
 *
 * In development (NODE_ENV !== "production"):
 *   Uses Ethereal Mail — a free fake SMTP service. Every email sent is
 *   captured and viewable at https://ethereal.email. No real email is
 *   delivered. The preview URL is logged to the console.
 *
 * In production:
 *   Reads SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS from .env.
 *   Works with any SMTP provider: Gmail, Outlook, SendGrid, Mailgun, Resend, etc.
 *
 * To switch providers, only the four SMTP_* env vars need to change —
 * the sendEmail() helper and all callers stay the same.
 */

import nodemailer from "nodemailer";

// Build the transporter once and reuse it (connection pooling)
let _transporter = null;

const getTransporter = async () => {
  if (_transporter) return _transporter;

  if (process.env.NODE_ENV !== "production") {
    // Auto-create a free Ethereal test account on first use
    const testAccount = await nodemailer.createTestAccount();

    _transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log(
      `[Email] Dev mode — using Ethereal. ` +
      `Inbox: https://ethereal.email/login  ` +
      `user=${testAccount.user}  pass=${testAccount.pass}`
    );
  } else {
    // Production — use env vars
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true only for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return _transporter;
};

/**
 * Send an email.
 *
 * @param {object} opts
 * @param {string}   opts.to       Recipient address
 * @param {string}   opts.subject  Subject line
 * @param {string}   opts.html     HTML body
 * @param {string}  [opts.text]    Plain-text fallback (auto-generated if omitted)
 * @returns {Promise<object>} Nodemailer info object
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = await getTransporter();

  const from = process.env.EMAIL_FROM || "ExpenseTracker <no-reply@expensetracker.local>";

  const info = await transporter.sendMail({ from, to, subject, html, text });

  if (process.env.NODE_ENV !== "production") {
    // Print the Ethereal preview link so you can inspect the email in the browser
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email] Preview: ${previewUrl}`);
  }

  return info;
};
