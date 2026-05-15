import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import upload from "../config/multer";
import {
  uploadAvatar,
  deleteAvatar,
  uploadListingPhotos,
  deleteListingPhoto
} from "../controllers/upload.controller";

const router = Router();

// Avatar — mounted under /users
// POST   /users/:id/avatar
// DELETE /users/:id/avatar
router.post("/:id/avatar", authenticate, upload.single("image"), uploadAvatar);
router.delete("/:id/avatar", authenticate, deleteAvatar);

// Listing photos — mounted under /listings
// POST   /listings/:id/photos
// DELETE /listings/:id/photos/:photoId
router.post("/:id/photos", authenticate, upload.array("photos", 5), uploadListingPhotos);
router.delete("/:id/photos/:photoId", authenticate, deleteListingPhoto);

export default router;
