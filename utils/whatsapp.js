import dotenv from 'dotenv';
dotenv.config({path: '../config/config.env'});
import twilio from "twilio";

const accountSid = process.env.TWILIO_SID;  
const authToken = process.env.TWILIO_AUTH;  
const client = twilio(accountSid, authToken);

console.log(accountSid, authToken);

export async function sendOrderConfirmation(customerPhone, content) {
  try {
    const message = await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio WhatsApp sandbox number
      to: `whatsapp:${customerPhone}`, // customer phone in international format
      body: content,
      //mediaUrl: [pdfUrl], // attach the PDF URL
    });

    console.log("Message sent:", message.sid);
  } catch (err) {
    console.error("Failed to send message:", err);
  }
};

export async function sendSMS(to, messageText) {
  try {
    const message = await client.messages.create({
      body: messageText,              // ✅ message text
      from: process.env.TWILIO_PHONE_NUMBER, // ✅ your Twilio number
      to: to                          // ✅ recipient phone number
    });

    console.log("✅ SMS sent! SID:", message.sid);
  } catch (error) {
    console.error("❌ Failed to send SMS:", error);
  }
};
