
import { Convention } from "../models/convention.js";

export async function createConvention(profile_details) {

  // Avoid storing empty image object
  if (profile_details.image) {
    Object.keys(profile_details.image).forEach((key) => {
      if (!profile_details.image[key]) delete profile_details.image[key];
    });
  }

  const newConvention = await Convention.create(profile_details);
  return newConvention;
}

export async function updateprofile(id, data) {
  return await Convention.findByIdAndUpdate(id, data, {new: true});
};

export async function deleteProfile(id) {
  return await Convention.findByIdAndDelete(id);
};

export async function findProfileByEmail(email) {
  return await Convention.findOne({ email });
};

export async function findbyId(id) {
  return await Convention.findById(id);
};

export async function getPricePerHour(id) {
  const per_hour = await Convention.findById(id).select("price_per_hour");
  return per_hour ? per_hour.price_per_hour : null;
};

export async function findProfileAndUpdateOTP(email, otp, expiresIn) {

  const profile = await Event.findOne({ email });

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

export async function Advance(email) {
  return Convention.aggregate([
    { $match: { email } },
    { $unwind: "$bookings" },
    { $match: { "bookings.status": "AdvancePaid" } },
    {
      $project: {
        _id: 0,
        conventionId: "$_id",
        convention_center_name: 1,
        email: 1,
        location: 1,
        phone: "$contact.phone",
        bookingId: "$bookings._id",
        name: "$bookings.name",
        contact: "$bookings.contact",
        advance: "$bookings.advance",
        total_price: "$bookings.total_price",
        date: "$bookings.date",
        time: "$bookings.time",
        status: "$bookings.status"
      }
    },
    { $sort: { date: -1 } },
    // {
    //   $setWindowFields: {
    //     sortBy: { date: -1 },
    //     output: {
    //       si_no: { $documentNumber: {} }
    //     }
    //   }
    // }
  ]);
};

export async function fullpaid(email) {
  return Convention.aggregate([
    { $match: { email } },
    { $unwind: "$bookings" },
    { $match: { "bookings.status": "FullPaid" } },
    {
      $project: {
        _id: 0,
        conventionId: "$_id",
        convention_center_name: 1,
        email: 1,
        location: 1,
        phone: "$contact.phone",
        bookingId: "$bookings._id",
        name: "$bookings.name",
        contact: "$bookings.contact",
        advance: "$bookings.advance",
        total_price: "$bookings.total_price",
        date: "$bookings.date",
        time: "$bookings.time",
        status: "$bookings.status"
      }
    },
    { $sort: { date: -1 } },
    // {
    //   $setWindowFields: {
    //     sortBy: { date: -1 },
    //     output: {
    //       si_no: { $documentNumber: {} }
    //     }
    //   }
    // }
  ]);
};

export async function cancelled(email) {
  return Convention.aggregate([
    { $match: { email } },
    { $unwind: "$bookings" },
    { $match: { "bookings.status": "Cancelled" } },
    {
      $project: {
        _id: 0,
        conventionId: "$_id",
        convention_center_name: 1,
        email: 1,
        location: 1,
        phone: "$contact.phone",
        bookingId: "$bookings._id",
        name: "$bookings.name",
        contact: "$bookings.contact",
        advance: "$bookings.advance",
        total_price: "$bookings.total_price",
        date: "$bookings.date",
        time: "$bookings.time",
        status: "$bookings.status"
      }
    },
    { $sort: { date: -1 } },
    // {
    //   $setWindowFields: {
    //     sortBy: { date: -1 },
    //     output: {
    //       si_no: { $documentNumber: {} }
    //     }
    //   }
    // }
  ]);
};

export async function countBookingStatus(email) {
  return Convention.aggregate([
    { $match: { email } },
    // Unwind bookings array, keep empty if no bookings
    { $unwind: { path: "$bookings", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        fullPaid: {
          $sum: { $cond: [{ $eq: ["$bookings.status", "FullPaid"] }, 1, 0] }
        },
        advancePaid: {
          $sum: { $cond: [{ $eq: ["$bookings.status", "AdvancePaid"] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ["$bookings.status", "Cancelled"] }, 1, 0] }
        }
      }
    },
    { $project: { _id: 0 } }
  ]);
};

export async function GetAllConventionCenter() {
  return await Convention.find();
};






export async function GetSingleConventionCenter(id) {
  return await Convention.findById(id);
}





/**
 * searchConvention(name, location, search)
 * - If `search` is provided: performs OR search across name and location.
 * - Otherwise: uses name and location as separate filters (AND).
 */
export async function searchConvention(name, location, search) {
  // If universal search param provided -> OR search on name & location
  if (search) {
    const rx = new RegExp(search.trim().replace(/\s+/g, ".*"), "i");
    return await Convention.find({
      $or: [
        { convention_center_name: { $regex: rx } },
        { location: { $regex: rx } }
      ]
    });
  }

  // Otherwise build AND-style query from name/location if provided
  const query = {};
  if (name) {
    query.convention_center_name = { $regex: new RegExp(name.trim().replace(/\s+/g, ".*"), "i") };
  }
  if (location) {
    query.location = { $regex: new RegExp(location.trim().replace(/\s+/g, ".*"), "i") };
  }

  return await Convention.find(query);
};



export async function updateConventionRepo(id, updateData) {
  return await Convention.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
}








