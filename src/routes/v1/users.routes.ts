import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserListings,
  getUserBookings
} from "../../controllers/users.controller";
import { getUserStats } from "../../controllers/stats.controller";

const router = Router();

// stats MUST come before /:id
router.get("/stats", getUserStats);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/:id/listings", getUserListings);
router.get("/:id/bookings", getUserBookings);

export default router;
