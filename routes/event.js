import express from 'express';
import { GenerateOtp,  GetAllEvents, Logins, SignUp , GetAllBookingsOnly, GetSingleEvent, SearchEvent, UpdateEvent, AddEventReview, GetEventReview} from '../controller/event.js';
import { conventionUploads } from '../utils/multer.js';


const router = express.Router();

router.post(
  "/profile/create",

  // DEBUG 1 — Check if request hit the route
  (req, res, next) => {
    console.log("➡️ [EVENT ROUTE] /profile/create HIT — before multer");
    next();
  },

  // Multer middleware (IMPORTANT)
  conventionUploads,   // <-- must be defined like conventionUploads

  // DEBUG 2 — Check multer processed files
  (req, res, next) => {
    console.log("➡️ [EVENT ROUTE] Multer finished. Files:", req.files);
    console.log("➡️ [EVENT ROUTE] Body:", req.body);
    next();
  },

  // Controller
  SignUp
);

router.patch(
  "/event/update/:id",

  (req, res, next) => {
    console.log("➡️ [ROUTE] /event/update HIT");
    next();
  },

  conventionUploads, // Multer uploader for image1, image2, etc.

  UpdateEvent
);


router.route('/profile/generate-otp').post(GenerateOtp);
router.route('/profile/login').post(Logins);
router.route('/profiles/getAllEvent').get(GetAllEvents);
router.get("/profile/all-bookings", GetAllBookingsOnly);
router.get("/single/:id", GetSingleEvent);
router.get("/search", SearchEvent);
router.post("/profile/:id/add-review", AddEventReview);
router.get("/profile/:id/review", GetEventReview);


export default router;
