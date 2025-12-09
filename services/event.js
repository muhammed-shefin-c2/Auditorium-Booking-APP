import { createEvent, findProfileAndUpdateOTP, findProfileByEmail, GetAllEvent, updateEventProfile, getAllBookingsOnly, GetSingleEventRepo, SearchEventRepo, updateEventRepo} from "../repositories/event.js";




export async function getAllBookingsOnly_() {
  return await getAllBookingsOnly();
}


export async function signUp(profileDetails) {
  const newProfile  = await createEvent(profileDetails);
  return newProfile;
};

export async function updateProfile(id, data) {
  const UPDProfile = await updateEventProfile(id, data);
};

export async function generateOTP(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresIn = 2 * 60 * 1000;

  const profile = await findProfileAndUpdateOTP(email, otp, expiresIn);

  return {otp};
};

export async function Login(email, otp) {
  const Profile = await findProfileByEmail(email);

  if(!Profile || !Profile.otp) {
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

export async function getAllEvent() {
  const event = GetAllEvent();
  return event;
};



export async function getSingleEvent_(id) {
  return await GetSingleEventRepo(id);
}

export async function searchEvent_(eventia_name, email, search) {
  return await SearchEventRepo(eventia_name, email, search);
}


export async function updateEventService(id, updateFields) {
  return await updateEventRepo(id, updateFields);
}
