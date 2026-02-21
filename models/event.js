import mongoose  from "mongoose";

const image_Schema = new mongoose.Schema({
  image1: {
    required: true,
    type: String
  }, 
  image2: {
    required: false,
    type: String
  },
  image3: {
    required: false, 
    type: String
  },
  image4: {
    required: false, 
    type: String
  }
});

const rating_schema = new mongoose.Schema({
  name: {
    required: false,
    type: String,
  },
  star: {
    required: false,
    type: Number,
    min: 1,
    max: 5
  },
  feedback_description: {
    required: false,
    type: String,
    maxlength: [300, "Feedback cannot exceed 300 characters"],
  },
});

const contact_schema = new mongoose.Schema({
  phone: {
    required: true,
    type: String
  },
  whatsapp: {
    required: false,
    type: String
  },
  facebook: {
    required: false,
    type: String
  },
  instagram: {
    required: false,
    type: String
  }
});

const otp_schema = new mongoose.Schema({
  email: { type: String, default: null },
  otp: { type: String, default: 123456 },
  expiresIn: { type: Number, default: 0 },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const event_schema = new mongoose.Schema({
  image: image_Schema,
  email: {
    required: true,
    type: String,
    unique: true
  },
  otp: otp_schema,
  eventia_name: {
    required: true,
    type: String
  },
  contact: contact_schema,
  rating: [rating_schema]
});

export const Event = mongoose.model('event', event_schema);
