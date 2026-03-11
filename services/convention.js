
//import { userInfo } from "os";
import { Advance, cancelled, countBookingStatus, createConvention, findbyId, findProfileAndUpdateOTP, findProfileByEmail, fullpaid, GetAllConventionCenter, getPricePerHour, updateprofile, GetSingleConventionCenter, searchConvention as searchRepo, updateConventionRepo} from "../repositories/convention.js";
//import { AdvancePaid } from "../controller/convention.js";
import { Convention } from "../models/convention.js";




export async function signUp(profileDetails) {

  // Ensure image object exists
  if (!profileDetails.image) {
    profileDetails.image = {};
  }

  // Remove undefined image fields
  ["image1", "image2", "image3", "image4"].forEach((key) => {
    if (!profileDetails.image[key]) {
      delete profileDetails.image[key];
    }
  });

  // Save to database
  const newProfile = await createConvention(profileDetails);
  return newProfile;
}

export async function updateProfile(id, data) {
  const UPDProfile = await updateprofile(id, data);
  return UPDProfile;
};

export async function generateOTP(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresIn = 2 * 60 * 1000;

  const profile = await findProfileAndUpdateOTP(email, otp, expiresIn);

  return {otp};
};

export async function login(email, otp) {
  const Profile = await findProfileByEmail(email);

  if (!Profile || !Profile.otp) {
    throw new Error("OTP not found");
  }

  const {otp: storedOTP, createdAt, expiresIn, used} = Profile.otp;
  const now = Date.now();
  const expiryTime = new Date(createdAt).getTime() + expiresIn;

  if(used) {
    throw new Error("OTP already used");
  }

  if (now > expiryTime) {
    throw new Error('OTP has expired');
  }

  if(otp !== storedOTP) {
    throw new Error("Invalid OTP");
  }

  Profile.otp.used = true;
  await Profile.save();

  return Profile;
};

export async function advancePaid(email) {
  return Advance(email);
}

export async function fullPaid(email) {
  return fullpaid(email);
}


export async function Cancelled(email) {
  return cancelled(email);
};


export async function totalAmount(email) {
  const advanceData = await Advance(email);     // returns array
  const fullPaidData = await fullpaid(email);   // returns array
  const cancelledData = await cancelled(email); // returns array

  let total_amount = 0;

  // Advance Paid
  if (Array.isArray(advanceData)) {
    advanceData.forEach(b => {
      total_amount += b.advance || 0;
    });
  }

  // Full Paid
  if (Array.isArray(fullPaidData)) {
    fullPaidData.forEach(b => {
      total_amount += b.total_price || 0;
    });
  }

  // Cancelled
  if (Array.isArray(cancelledData)) {
    cancelledData.forEach(b => {
      total_amount += b.advance || 0;
    });
  }

  console.log("total Amount: ", total_amount);
  return total_amount;
};

export async function CountBookingStatus(email) {
  const result = await countBookingStatus(email);
  console.log("🔎 Aggregation raw result:", JSON.stringify(result, null, 2));
  return result.length ? result[0] : { fullPaid: 0, advancePaid: 0, cancelled: 0 };
};

// services/convention.js
export async function AdvancePay(id, time) {
  const perHour = await getPricePerHour(id);

  // normalize input
  const t = time.trim(); 
  if (t === 'Forenoon' || t === 'Evening') return perHour * 3 * 0.3;
  if (t === 'FullDay') return perHour * 6 * 0.3;
  throw new Error(`Invalid scheduled time: ${time}`);
}

export async function FullPaidAmount(id, time) {
  const perHour = await getPricePerHour(id);
  const t = time.trim();
  if (t === 'Forenoon' || t === 'Evening') return perHour * 3;
  if (t === 'FullDay') return perHour * 6;
  throw new Error(`Invalid scheduled time: ${time}`);
}

export async function booked(id, name, contact, date, time, status, paid_status, razorpayOrderId) {
  const convention = await findbyId(id);
  if (!convention) throw new Error("Convention not found");

  const advanceAmount = await AdvancePay(id, time);
  const fullAmount = await FullPaidAmount(id, time);

  convention.bookings.push({
    name,
    contact: "+91" + contact,
    advance: advanceAmount,
    total_price: fullAmount,
    date: new Date(date),
    time: time.trim(),
    status,           // AdvancePaid / FullPaid
    paid_status,      // Unpaid
    razorpayOrderId
  });

  await convention.save();
  return { message: "Booking initiated successfully. Proceed to pay." };
}

export async function checkAvailabilty(conventionId, date) {

  const start = new Date(date);
  start.setHours(0,0,0,0);

  const end = new Date(date);
  end.setHours(23,59,59,999);

  const convention = await Convention.findById(conventionId).lean();

  if (!convention) {
    throw new Error("Convention not found");
  }

  const timeSlots = {
    Forenoon: true,
    Evening: true,
    FullDay: true
  };

  const bookings = convention.bookings.filter(b => {

    const bookedDate = new Date(b.date);
    bookedDate.setHours(0,0,0,0);

    return (
      bookedDate.getTime() === start.getTime() &&
      b.status !== "Cancelled"
    );

  });

  bookings.forEach(b => {

    if (b.time === "FullDay") {

      timeSlots.Forenoon = false;
      timeSlots.Evening = false;
      timeSlots.FullDay = false;

    } else {

      timeSlots[b.time] = false;
      timeSlots.FullDay = false;

    }

  });

  return { availableSlots: timeSlots };
}

export async function getAllConvention_() {
  const convention = GetAllConventionCenter();
  return convention;
};


export async function getSingleConvention_(id) {
  const convention = await GetSingleConventionCenter(id);
  return convention;
}



export async function searchConvention_(name, location, search) {
  return await searchRepo(name, location, search);
}



export async function updateConvention_(id, conventionDetails) {
  return await updateConventionRepo(id, conventionDetails);
};



