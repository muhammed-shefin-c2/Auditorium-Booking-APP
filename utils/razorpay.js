import dotenv from 'dotenv';
dotenv.config({path: './config/config.env'});

import Razorpay from 'razorpay';
import crypto from 'crypto';



const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});





export const createOrder = async (amount, currency = 'INR', receipt) => {
  try {
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
      payment_capture: 1,
    };
    return await razorpayInstance.orders.create(options);
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    throw new Error("Failed to create Razorpay order");
  }
};


export const verifySignature = (orderId, paymentId, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(orderId + "|" + paymentId)
    .digest('hex');

  return expectedSignature === signature;
};

