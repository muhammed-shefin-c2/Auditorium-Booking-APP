import { generateOTP, signUp, login, advancePaid, fullPaid, Cancelled, totalAmount , CountBookingStatus, AdvancePay, booked, FullPaidAmount, checkAvailabilty, getAllConvention_, getSingleConvention_, searchConvention_, updateConvention_} from "../services/convention.js";
import { findbyId } from "../repositories/convention.js";
import { createOrder, verifySignature } from "../utils/razorpay.js";
import { Convention } from "../models/convention.js";
import { sendOrderConfirmation, sendSMS } from "../utils/whatsapp.js";
import { sendEmail } from "../utils/mailer.js";


// ⭐ NEW IMPORT FOR RESEND (Solution 1)
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

// -------------------------------------------------------------
// SIGNUP (UNCHANGED)
// -------------------------------------------------------------
export async function SignUp(req, res) {
  console.log("🔥 [CONTROLLER] SignUp reached");

  console.log("🔥 [CONTROLLER] RAW FILES →", req.files);
  console.log("🔥 [CONTROLLER] RAW BODY →", req.body);

  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      console.log("❌ [CONTROLLER] No files received from multer");
      return res.status(400).json({
        success: false,
        error: "Multer did not receive any files",
        files: req.files,
      });
    }

    const getField = (obj, bracketKey, nestedPath) => {
      if (!obj) return undefined;
      if (Object.prototype.hasOwnProperty.call(obj, bracketKey))
        return obj[bracketKey];
      try {
        return nestedPath.reduce(
          (acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined),
          obj
        );
      } catch (e) {
        return undefined;
      }
    };

    const profileDetails = {
      email: getField(req.body, "email", ["email"]) || "",
      convention_center_name: getField(req.body, "convention_center_name", ["convention_center_name"]) || "",
      location: getField(req.body, "location", ["location"]) || "",
      price_per_hour: (() => {
        const p = getField(req.body, "price_per_hour", ["price_per_hour"]);
        const n = Number(p);
        return Number.isFinite(n) ? n : p;
      })(),
      air_conditioned: getField(req.body, "air_conditioned", ["air_conditioned"]) || "No",

      contact: {
        phone: getField(req.body, "contact[phone]", ["contact", "phone"]),
        whatsapp: getField(req.body, "contact[whatsapp]", ["contact", "whatsapp"]),
        facebook: getField(req.body, "contact[facebook]", ["contact", "facebook"]),
        instagram: getField(req.body, "contact[instagram]", ["contact", "instagram"]),
      },

      size: {
        food_court: getField(req.body, "size[food_court]", ["size", "food_court"]),
        main_hall: getField(req.body, "size[main_hall]", ["size", "main_hall"]),
        parking_lot: getField(req.body, "size[parking_lot]", ["size", "parking_lot"]),
      },

      image: {}
    };

    console.log("🟦 profileDetails BEFORE images →", profileDetails);

    try {
      Object.keys(req.files).forEach((key) => {
        if (Array.isArray(req.files[key]) && req.files[key][0]) {
          profileDetails.image[key] =
            req.files[key][0].path ||
            req.files[key][0].location ||
            req.files[key][0].url;
        }
      });
    } catch (err) {
      console.log("❌ Error parsing file paths →", err);
      return res.status(500).json({ error: "Error reading file paths" });
    }

    console.log("🟩 Final profileDetails →", profileDetails);

    if (!profileDetails.contact || !profileDetails.contact.phone) {
      console.log("❌ Missing contact.phone");
      return res.status(400).json({ success: false, error: "contact.phone is required" });
    }
    if (!profileDetails.image || !profileDetails.image.image1) {
      console.log("❌ image1 missing");
      return res.status(400).json({ success: false, error: "image1 is required" });
    }

    console.log("🟩 Calling signUp() service...");
    const newProfile = await signUp(profileDetails);

    console.log("🟢 NEW PROFILE CREATED →", newProfile);

    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: newProfile
    });

  } catch (error) {
    console.log("❌ CRASHED →", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create profile",
      details: error.message
    });
  }
}

// -------------------------------------------------------------
// UPDATE CONVENTION (UNCHANGED)
// -------------------------------------------------------------
export async function UpdateConvention(req, res) {
  console.log("🔥 UpdateConvention reached");
  console.log("🔥 BODY:", req.body);
  console.log("🔥 FILES:", req.files);

  try {
    const { id } = req.params;

    const getField = (obj, bracketKey, nestedPath) => {
      if (!obj) return undefined;
      if (Object.prototype.hasOwnProperty.call(obj, bracketKey)) {
        return obj[bracketKey];
      }
      try {
        return nestedPath.reduce(
          (acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined),
          obj
        );
      } catch {
        return undefined;
      }
    };

    const updateData = {};
    const basicFields = ["email", "convention_center_name", "location", "air_conditioned"];
    basicFields.forEach(f => {
      const value = getField(req.body, f, [f]);
      if (value !== undefined && value !== "") updateData[f] = value;
    });

    const price = getField(req.body, "price_per_hour", ["price_per_hour"]);
    if (price !== undefined && price !== "" && !isNaN(price)) {
      updateData.price_per_hour = Number(price);
    }

    ["phone", "whatsapp", "facebook", "instagram"].forEach(f => {
      const value = getField(req.body, `contact[${f}]`, ["contact", f]);
      if (value !== undefined && value !== "") {
        updateData[`contact.${f}`] = value;
      }
    });

    ["food_court", "main_hall", "parking_lot"].forEach(f => {
      const value = getField(req.body, `size[${f}]`, ["size", f]);
      if (value !== undefined && value !== "" && !isNaN(value)) {
        updateData[`size.${f}`] = Number(value);
      }
    });

    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        if (Array.isArray(req.files[key]) && req.files[key][0]) {
          const filePath =
            req.files[key][0].path ||
            req.files[key][0].location ||
            req.files[key][0].url;

          updateData[`image.${key}`] = filePath;
        }
      });
    }

    console.log("🟩 FINAL UPDATE PAYLOAD:", updateData);

    const updated = await Convention.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Convention not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Convention updated successfully",
      data: updated
    });

  } catch (err) {
    console.log("❌ UPDATE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update convention",
      error: err.message
    });
  }
}

// -------------------------------------------------------------
// ⭐⭐ NEW — REPLACED GenerateOtp with Resend
// -------------------------------------------------------------
export async function GenerateOtp(req, res) {
  try {
    const { email } = req.body;

    const { otp } = await generateOTP(email);

    await sendEmail({
      to: email,
      subject: "Your OTP Code",
      html: `
        <h1>Hello ${email}</h1>
        <p>Your One-Time Password (OTP) is:</p>
        <h2 style="color:blue;">${otp}</h2>
        <p>This OTP is valid for 2 minutes. Please do not share it with anyone.</p>
      `
    });

    res.status(200).json({
      message: "OTP sent successfully",
      newotp: otp
    });

  } catch (error) {
    console.error("OTP ERROR:", error);
    res.status(500).json({
      error: "failed to generate OTP",
      message: error.message
    });
  }
}


// -------------------------------------------------------------
// LOGIN (UNCHANGED)
// -------------------------------------------------------------
export async function Login(req, res) {
  try {
    const { email, otp } = req.body;

    const loginProfile = await login(email, otp);

    res.status(200).json({message: "Login successful", data: loginProfile});
  } catch (error) {
    res.status(500).json({error: "Login failed", message: error.message});
  }
};

// -------------------------------------------------------------
export async function AdvancePaid(req, res) {
  try {
    const { email } = req.body;
    const advance = await advancePaid(email);
    res.status(200).json({Advance: advance});
  } catch (error) {
    res.status(500).json({error: "failed", message: error.message});
  }
};
// -------------------------------------------------------------
export async function FullPaid(req, res) {
  try {
    const { email } = req.body;
    const fullpaid = await fullPaid(email);
    res.status(200).json({FullPaid: fullpaid});
  } catch (error) {
    res.status(500).json({error: "failed", message: error.message});
  }
};
// -------------------------------------------------------------
export async function Cancel(req, res) {
  try {
    const { email } = req.body;
    const cancelled = await Cancelled(email);
    res.status(200).json({Cancelled: cancelled});
  } catch (error) {
    res.status(500).json({error: "failed", message: error.message});
  }
};
// -------------------------------------------------------------
export async function total(req, res) {
  try {
    const { email } = req.body;
    const totalamount = await totalAmount(email);

    res.status(200).json({Total_Earned: totalamount});
  } catch(error) {
    res.status(500).json({error: "failed", message: error.message});
  }
};
// -------------------------------------------------------------
export async function count(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const counting = await CountBookingStatus(email);

    console.log("✅ Processed result:", JSON.stringify(counting, null, 2));

    return res.status(200).json({ Total_Counts: counting });
  } catch (error) {
    console.error("❌ Error in count controller:", error);
    return res.status(500).json({ error: "failed", message: error.message });
  }
}
// -------------------------------------------------------------
export async function checkDateTime(req, res) {
  try{
    const {email, date, time } = req.body;

    if (!email) {
      return res.status(400).json({error: "Email is required"});
    }

    const check = await checkAvailabilty(email, date, time);

    return res.status(200).json({ Cheking: check });
  } catch (error) {
    return res.status(500).json({ error: "failed", message: error.message});
  }
}
// -------------------------------------------------------------
export async function book(req, res) {
  try {
    const { id, name, contact, date, time, status } = req.body;

    if (!name || !contact || !time || !status || !date || !id) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const convention = await findbyId(id);
    if (!convention) return res.status(404).json({ error: "Convention center not found" });

    let amount = 0;
    if (status === "AdvancePaid") amount = await AdvancePay(id, time);
    else if (status === "FullPaid") amount = await FullPaidAmount(id, time);
    else return res.status(400).json({ error: "Invalid status" });

    const razorpayOrder = await createOrder(amount, "INR", `receipt_${Date.now()}`);

    const booking_initiated = await booked(
      id,
      name,
      contact,
      date,
      time,
      status,
      "Unpaid",
      razorpayOrder.id
    );

    return res.status(200).json({
      message: booking_initiated.message,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });

  } catch (error) {
    console.error("Error initiating booking: ", error);
    return res.status(500).json({ error: error.message });
  }
}
// -------------------------------------------------------------
export async function VerifyPayment(req, res) {
  try {
    const { contact, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const isValid = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const convention = await Convention.findOne({ "bookings.razorpayOrderId": razorpay_order_id});
    if (!convention) {
      return res.status(404).json({ error: "Convention not found" });
    }

    const booking = convention.bookings.find(
      o => o.razorpayOrderId === razorpay_order_id && o.paid_status === "Unpaid"
    );

    if (!booking) {
      return res.status(400).json({ error: "Matching unpaid booking not found" });
    }

    booking.paid_status = "Paid";
    booking.razorpayPaymentId = razorpay_payment_id;

    await convention.save();

    const balance = 
      booking.status === "FullPaid"
      ? 0
      : (booking.total_price || 0) - (booking.advance || 0);

    await sendOrderConfirmation(
      booking.contact,
      `🎉 Booking Confirmed!\n\nID: ${convention._id}\n Auditorium: ${convention.convention_center_name}\n Location: ${convention.location}\n Name: ${booking.name}\nDate: ${booking.date.toDateString()}\nTime: ${booking.time}\n Advance: ₹${booking.advance}\n Total: ₹${booking.total_price}\n Balance: ₹${balance}\nStatus: ${booking.status}`
    );

    await sendSMS(
      booking.contact,
      `🎉 Booking Confirmed!\n\nID: ${convention._id}\n Auditorium: ${convention.convention_center_name}\n Location: ${convention.location}\n Name: ${booking.name}\nDate: ${booking.date.toDateString()}\nTime: ${booking.time}\n Advance: ₹${booking.advance}\n Total: ₹${booking.total_price}\n Balance: ₹${balance}\nStatus: ${booking.status}`
    );

    return res.status(200).json({ message: "Payment verified and booking updated" });
  } catch (error) {
    console.error("VerifyPayment error:", error);
    return res.status(500).json({ error: error.message });
  }
}
// -------------------------------------------------------------
export async function GetAllConvetion(req, res) {
  try{
    const convention = await getAllConvention_();
    res.status(200).json(convention);
  } catch (error) {
    res.status(500).json({error: "failed to fetch products"});
  }
}
// -------------------------------------------------------------
export async function GetSingleConvention(req, res) {
  try {
    const { id } = req.params;

    const convention = await getSingleConvention_(id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        message: "Convention center not found"
      });
    }

    res.status(200).json({
      success: true,
      data: convention
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get convention center"
    });
  }
}
// -------------------------------------------------------------
export async function SearchConvention(req, res) {
  try {
    const { search, name, location } = req.query;

    const results = await searchConvention_(name, location, search);

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message
    });
  }
}


export const AddReview = async (req, res) => {
  try {
    const { star, feedback_description } = req.body;
    const { id } = req.params;

    // Manual validation (extra safety)
    if (star < 1 || star > 5) {
      return res.status(400).json({
        success: false,
        message: "Star must be between 1 and 5"
      });
    }

    if (feedback_description.split(/\s+/).length > 50) {
      return res.status(400).json({
        success: false,
        message: "Feedback must be maximum 50 words"
      });
    }

    const convention = await Convention.findById(id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        message: "Convention not found"
      });
    }

    convention.rating.push({
      star,
      feedback_description
    });

    await convention.save();

    res.status(200).json({
      success: true,
      message: "Review added successfully",
      ratings: convention.rating
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const GetReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const convention = await Convention.findById(id).select("rating");

    if (!convention) {
      return res.status(404).json({
        success: false,
        message: "Convention not found"
      });
    }

    res.status(200).json({
      success: true,
      total_reviews: convention.rating.length,
      reviews: convention.rating
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};







