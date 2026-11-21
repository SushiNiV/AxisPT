// utils/mailer.js
// Real sending needs: npm i nodemailer
// .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
const smtpConfigured = Boolean(process.env.SMTP_HOST);

let transporter = null;
if (smtpConfigured) {
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

exports.sendMail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    // Development fallback: no SMTP set up, so print the email instead of sending it.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured; cannot send email.');
    }
    console.log(`\n--- DEV EMAIL (not sent) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n----------------------------\n`);
    return;
  }
  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};