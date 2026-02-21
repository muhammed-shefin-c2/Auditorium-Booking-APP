import express from 'express';
import { AdvancePaid, Cancel, FullPaid, GenerateOtp, Login, SignUp, total, count, book, VerifyPayment, checkDateTime, GetAllConvetion, GetSingleConvention, SearchConvention, UpdateConvention, AddReview } from '../controller/convention.js';
import { conventionUploads } from '../utils/multer.js';



const router = express.Router();



router.post(
  "/profile/create",

  // DEBUG 1 — request reached route
  (req, res, next) => {
    console.log("➡️ [ROUTE] /profile/create HIT — before multer");
    next();
  },

  // Multer middleware
  conventionUploads,

  // DEBUG 2 — multer finished OR error occurred
  (req, res, next) => {
    console.log("➡️ [ROUTE] Multer finished. Files:", req.files);
    next();
  },

  // Controller
  SignUp
);

router.patch(
  "/profile/update/:id",

  // Debug
  (req, res, next) => {
    console.log("➡️ [ROUTE] /profile/update HIT");
    next();
  },

  // Multer (same as create)
  conventionUploads,

  // Controller
  UpdateConvention
);
router.route('/profile/generate-otp').post(GenerateOtp);
router.route('/profile/login').post(Login);
router.route('/profile/advance').post(AdvancePaid);
router.route('/profile/full-paid').post(FullPaid);
router.route('/profile/cancelled').post(Cancel);
router.route('/profile/total-earning').post(total);
router.route('/profile/count-booking').post(count);
router.route('/user/booking/booking_payment').post(book);
router.route('/user/order/success').post(VerifyPayment);
router.route('/profile/booking/check').post(checkDateTime);
router.route('/profile/getAllConvention').get(GetAllConvetion);
router.get("/profile/getSingleConvention/:id", GetSingleConvention);
router.get("/profile/search", SearchConvention);
router.post("/profile/:id/add-review", AddReview);
router.get("/profile/:id/reviews", GetReviews);

export default router;
