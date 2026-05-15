import { Router } from "express";
import { authenticate, requireGuest } from "../middlewares/auth.middleware";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  deleteBooking,
  updateBookingStatus
} from "../controllers/bookings.controller";

const router = Router();

router.get("/", getAllBookings);
router.get("/:id", getBookingById);
router.post("/", authenticate, requireGuest, createBooking);
router.delete("/:id", authenticate, deleteBooking);
router.patch("/:id/status", authenticate, updateBookingStatus);

export default router;