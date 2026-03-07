
import { read } from "fs";
import { Event } from "../models/event.js";
import { Convention } from "../models/convention.js";

export async function createEvent(profile_details) {
  return await Event.create(profile_details);
};

export async function updateEventProfile(id, data) {
  return await Event.findByIdAndUpdate(id, data, {new: true});
};

export async function deleteProfilef(id) {
  return await Event.findByIdAndDelete(id);
};

export async function findProfileByEmail(email) {
  return await Event.findOne({email});
};


export async function findProfileAndUpdateOTP(email, otp, expiresIn) {

  const profile = await Convention.findOne({ email });

  if (!profile) {
    throw new Error("Account not found. Please signup first.");
  }

  profile.otp = {
    email,
    otp,
    expiresIn,
    used: false,
    createdAt: new Date()
  };

  await profile.save();

  return profile;
}


export async function GetAllEvent() {
  return await Event.find();
};




export async function getAllBookingsOnly() {
  return await Convention.aggregate([
    { $unwind: "$bookings" },  // convert each booking to separate row
    {
      $replaceRoot: { newRoot: "$bookings" } // keep ONLY booking object
    },
    { $sort: { createdAt: -1 } } // sort by booking date (newest first)
  ]);
}




export async function GetSingleEventRepo(id) {
  return await Event.findById(id);
}




export async function SearchEventRepo(eventia_name, email, search) {
  if (search) {
    const rx = new RegExp(search.trim().replace(/\s+/g, ".*"), "i");
    return await Event.find({
      $or: [
        { eventia_name: { $regex: rx } },
        { email: { $regex: rx } }
      ]
    });
  }

  const query = {};

  if (eventia_name) {
    query.eventia_name = {
      $regex: new RegExp(eventia_name.trim().replace(/\s+/g, ".*"), "i")
    };
  }

  if (email) {
    query.email = {
      $regex: new RegExp(email.trim().replace(/\s+/g, ".*"), "i")
    };
  }

  return await Event.find(query);
}


export async function updateEventRepo(id, updateData) {
  return await Event.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
}
