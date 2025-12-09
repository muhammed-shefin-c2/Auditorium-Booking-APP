import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// DEBUG 0: Cloudinary loaded
console.log("🔵 [MULTER] Cloudinary loaded →", cloudinary.config().cloud_name);

// INIT STORAGE
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "auditorium-images",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

// DEBUG 1: Intercept file handling
const originalHandleFile = storage._handleFile;
storage._handleFile = function (req, file, cb) {
  console.log("🟣 [MULTER] File received →", file.fieldname, file.originalname);
  return originalHandleFile.call(this, req, file, cb);
};

// DEBUG 2: Intercept file removal
const originalRemoveFile = storage._removeFile;
storage._removeFile = function (req, file, cb) {
  console.log("🟣 [MULTER] Removing file →", file.fieldname);
  return originalRemoveFile.call(this, req, file, cb);
};

export const conventionUploads = multer({ storage }).fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
]);
