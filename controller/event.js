
import { generateOTP, signUp , Login, getAllEvent, getAllBookingsOnly_, getSingleEvent_, searchEvent_, updateEventService} from "../services/event.js";

import { Event } from "../models/event.js";
import { sendEmail } from "../utils/mailer.js";


export async function SignUp(req, res) {
  console.log("🔥 [EVENT CONTROLLER] SignUp reached");
  console.log("🔥 RAW FILES →", req.files);
  console.log("🔥 RAW BODY →", req.body);

  try {
    // --- Check multer
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No images received",
        files: req.files,
      });
    }

    // Helper function to read bracket or nested JSON
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

    // Build Event profile body using safe getters
    const eventDetails = {
      email: getField(req.body, "email", ["email"]) || "",
      eventia_name: getField(req.body, "eventia_name", ["eventia_name"]) || "",

      contact: {
        phone: getField(req.body, "contact[phone]", ["contact", "phone"]),
        whatsapp: getField(req.body, "contact[whatsapp]", ["contact", "whatsapp"]),
        facebook: getField(req.body, "contact[facebook]", ["contact", "facebook"]),
        instagram: getField(req.body, "contact[instagram]", ["contact", "instagram"]),
      },

      image: {
        // will be filled by multer paths below
      },

      rating: {
        star: getField(req.body, "rating[star]", ["rating", "star"]),
        feedback_description: getField(req.body, "rating[feedback_description]", ["rating", "feedback_description"])
      }
    };

    console.log("🟦 eventDetails BEFORE adding images:", eventDetails);

    // Attach cloudinary image paths
    try {
      Object.keys(req.files).forEach((key) => {
        if (Array.isArray(req.files[key]) && req.files[key][0]) {
          eventDetails.image[key] = req.files[key][0].path ||
                                    req.files[key][0].location ||
                                    req.files[key][0].url;
        }
      });
    } catch (err) {
      console.log("❌ Error reading uploaded image paths:", err);
      return res.status(500).json({ error: "Error reading uploaded images" });
    }

    console.log("🟩 Final eventDetails →", eventDetails);

    // ---- VALIDATION ----
    if (!eventDetails.email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    if (!eventDetails.eventia_name) {
      return res.status(400).json({ success: false, error: "eventia_name is required" });
    }

    if (!eventDetails.contact || !eventDetails.contact.phone) {
      return res.status(400).json({ success: false, error: "contact.phone is required" });
    }

    if (!eventDetails.image || !eventDetails.image.image1) {
      return res.status(400).json({ success: false, error: "image1 is required" });
    }

    // CALL SERVICE
    console.log("🟩 Calling Event signUp() service...");
    const newEvent = await signUp(eventDetails);

    console.log("🟢 NEW EVENT PROFILE CREATED →", newEvent);

    return res.status(201).json({
      success: true,
      message: "Event profile created successfully",
      data: newEvent
    });

  } catch (error) {
    console.log("❌ [EVENT SIGNUP ERROR] →", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create event profile",
      details: error.message
    });
  }
};

export async function UpdateEvent(req, res) {
  console.log("🔥 [CONTROLLER] UpdateEvent reached");
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
          (acc, k) =>
            acc && acc[k] !== undefined ? acc[k] : undefined,
          obj
        );
      } catch {
        return undefined;
      }
    };

    const updateData = {};

    // BASIC FIELDS
    const basicFields = ["email", "eventia_name"];
    basicFields.forEach(f => {
      const value = getField(req.body, f, [f]);
      if (value !== undefined && value !== "") {
        updateData[f] = value;
      }
    });

    // CONTACT (dot notation)
    ["phone", "whatsapp", "facebook", "instagram"].forEach(f => {
      const value = getField(req.body, `contact[${f}]`, ["contact", f]);
      if (value !== undefined && value !== "") {
        updateData[`contact.${f}`] = value;
      }
    });

    // RATING (dot notation)
    ["star", "feedback_description"].forEach(f => {
      const value = getField(req.body, `rating[${f}]`, ["rating", f]);
      if (value !== undefined && value !== "") {
        updateData[`rating.${f}`] = value;
      }
    });

    // IMAGES (dot notation)
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

    console.log("🟩 FINAL EVENT UPDATE PAYLOAD:", updateData);

    const updated = await Event.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updated
    });

  } catch (err) {
    console.log("❌ EVENT UPDATE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: err.message
    });
  }
};



export async function GenerateOtp(req, res) {
  try {
    const { email } = req.body;

    // Generate the OTP
    const { otp } = await generateOTP(email);

    // Send via RESEND email service
    await sendEmail({
      to: email,
      subject: "Your Eventia Login OTP",
      html: `
        <h1>Hello, ${email}</h1>
        <p>Your One-Time Password (OTP) is:</p>
        <h2 style="color:#4f46e5;">${otp}</h2>
        <p>This OTP is valid for 2 minutes. Please do not share it with anyone.</p>
      `
    });

    // Success Response
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


export async function Logins(req, res, next) {
  try{
    const {email, otp} = req.body;

    const loginProfile = await Login(email, otp);

    console.log(loginProfile);

    res.status(200).json({message: "Login successful", data: loginProfile});
  } catch(error) {
    res.status(500).json({error: "Login failed", message: error.message});
  }
}


export async function GetAllEvents(req, res, next) {
  try{ 
    const event = await getAllEvent();
    res.status(200).json(event);
  }catch (error) {
    res.status(500).json({error: "failed to fetch products"});
  };
};





export async function GetAllBookingsOnly(req, res) {
  try {
    const bookings = await getAllBookingsOnly_();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message
    });
  }
};



export async function GetSingleEvent(req, res) {
  try {
    const { id } = req.params;
    const event = await getSingleEvent_(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: event
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get event"
    });
  }
}

export async function SearchEvent(req, res) {
  try {
    const { search, eventia_name, email } = req.query;

    const results = await searchEvent_(eventia_name, email, search);

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


// POST → Add / Update Review
export const AddEventReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { star, feedback_description } = req.body;

    if (star < 1 || star > 5) {
      return res.status(400).json({
        success: false,
        message: "Star must be between 1 and 5"
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    event.rating = {
      star,
      feedback_description
    };

    await event.save();

    res.status(200).json({
      success: true,
      message: "Review added successfully",
      rating: event.rating
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET → Fetch Review
export const GetEventReview = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).select("rating");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.status(200).json({
      success: true,
      rating: event.rating
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
