import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getListingReviews,
  createReview,
  deleteReview
} from "../controllers/reviews.controller";

const router = Router();

// GET /listings/:id/reviews
router.get("/listings/:id/reviews", getListingReviews);

// POST /listings/:id/reviews
router.post("/listings/:id/reviews", authenticate, createReview);

// DELETE /reviews/:id
router.delete("/reviews/:id", authenticate, deleteReview);

export default router;
