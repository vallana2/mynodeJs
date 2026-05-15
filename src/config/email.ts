import nodemailer from "nodemailer";

// Transporter created once at module load — never inside sendEmail
const transporter = nodemailer.createTransport({
  host: process.env["EMAIL_HOST"],
  port: Number(process.env["EMAIL_PORT"]) || 587,
  secure: false,
  auth: {
    user: process.env["EMAIL_USER"],
    pass: process.env["EMAIL_PASS"]
  },
  tls: {
    rejectUnauthorized: false // fixes self-signed certificate error
  }
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  await transporter.sendMail({
    from: process.env["EMAIL_FROM"],
    to,
    subject,
    html
  });
};