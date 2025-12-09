import dotenv from 'dotenv';
dotenv.config({path: '../config/config.env'});

import NodeMailer from 'nodemailer';


export const sendEmail = async ({to, subject, html, attachments}) => {
  try {

    console.log('SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER
});


    const transporter = NodeMailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments,
    });

    console.log(`✅ Email sent to ${to} successfully`);
  }catch (error) {
    console.log("❌ Email sending Failed:", error);
    throw error;
  }
};