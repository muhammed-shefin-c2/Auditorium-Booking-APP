import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config({ path: "../config/config.env" });

// Create Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("📨 Sending email using Resend →", to);

    const result = await resend.emails.send({
      from: "Auditorium App <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("📧 Email Sent Result:", result);

    if (result.error) {
      console.error("❌ RESEND ERROR:", result.error);
      throw new Error(result.error.message);
    }

    return result;
  } catch (error) {
    console.error("❌ FAILED TO SEND EMAIL:", error);
    throw error;
  }
};
