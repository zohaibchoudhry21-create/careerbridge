import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing env variables: ${missing.join(', ')}`);
  console.error('Update backend/.env first, then run: npm run test:email');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const testTo = process.argv[2] || process.env.SMTP_USER;

try {
  await transporter.verify();
  console.log('SMTP connection successful.');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: testTo,
    subject: 'AI CareerBridge SMTP Test',
    html: '<p>SMTP is working. Your verification emails are ready to send.</p>',
  });

  console.log(`Test email sent to: ${testTo}`);
  process.exit(0);
} catch (error) {
  console.error('SMTP test failed:', error.message);
  process.exit(1);
}
