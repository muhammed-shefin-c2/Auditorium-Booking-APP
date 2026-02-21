import mongoose from "mongoose";

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


const size_schema = new mongoose.Schema({
  food_court: {
    required: false,
    type: Number
  },
  main_hall: {
    required: false,
    type: Number
  },
  parking_lot: {
    required: false,
    type: Number
  }
});


const otp_schema = new mongoose.Schema({
  email: String,
  otp: String,
  expiresIn: Number,
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
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

const rating_schema = new mongoose.Schema({
  star: {
    required: false,
    type: Number
    min: 1,
    max: 5
  },
  feedback_description: {
    required: false,
    type: String,
    validate: {
      validator: function (value){
        return value.split(/\s+/).lenght <= 50;
      },
      message: "Feedback must be maximum 50 words"
    }
  },
});

const booking_schema = new mongoose.Schema({
  name: {
    required: true,
    type: String
  },
  contact: {
    required: true,
    type: String
  },
  advance: {
    required: true,
    type: Number,
  },
  total_price: {
    required: false,
    type: Number
  },
  date: {
    required: true,
    type: Date
  },
  time: {
    enum: ['Forenoon', 'Evening', 'FullDay'],
    default: 'Forenoon',
    required: true,
    type: String
  },
  status: {
    enum: ['FullPaid', 'AdvancePaid', 'Cancelled'],
    default: "AdvancePaid",
    required: true,
    type: String
  },
  paid_status: {
    type: String,
    enum: ['Unpaid', 'Paid'],
    default: 'Unpaid'
  },
  razorpayOrderId: {
    type: String,
    required: false   // ensures it’s always stored
  },
  razorpayPaymentId: {
    type: String     // optional, we’ll fill after payment success
  },
  createdAt: { type: Date, default: Date.now }

});



const convention_schema = new mongoose.Schema({
  image: image_Schema,
  email: {
    required: true,
    type: String,
    unique: true
  },
  otp: otp_schema,
  convention_center_name: {
    required: true,
    type: String
  },
  location: {
    required: true,
    type: String
  },
  contact: contact_schema,
  size: size_schema,

  price_per_hour: {
    reequired: true,
    type: Number
  },

  air_conditioned: {
    enum: ['Yes', 'No'],
    default: 'No',
    required: true,
    type: String
  },
  rating: [rating_schema],
  bookings: [booking_schema]
});

export const Convention = mongoose.model('convention', convention_schema);
