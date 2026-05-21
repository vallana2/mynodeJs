import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  aiSearch,
  generateDescription,
  chat,
  recommend,
  reviewSummary
} from "../../controllers/ai.controller";

const router = Router();

/**
 * @swagger
 * /ai/search:
 *   post:
 *     summary: Smart listing search using natural language
 *     tags: [AI]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: apartment in Kigali under $100 for 2 guests
 *     responses:
 *       200:
 *         description: Paginated listings matching extracted filters
 *       400:
 *         description: Could not extract filters from query
 */
router.post("/search", aiSearch);

/**
 * @swagger
 * /ai/listings/{id}/generate-description:
 *   post:
 *     summary: Generate AI listing description with tone control
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, luxury]
 *                 default: professional
 *     responses:
 *       200:
 *         description: Generated description saved to database
 *       403:
 *         description: Not your listing
 *       404:
 *         description: Listing not found
 */
router.post("/listings/:id/generate-description", authenticate, generateDescription);

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Guest support chatbot with optional listing context
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, message]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: user-123-session-1
 *               message:
 *                 type: string
 *                 example: Does this place have WiFi?
 *               listingId:
 *                 type: string
 *                 example: a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d
 *     responses:
 *       200:
 *         description: AI response with session info
 */
router.post("/chat", chat);

/**
 * @swagger
 * /ai/recommend:
 *   post:
 *     summary: AI booking recommendations based on history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended listings based on booking history
 *       400:
 *         description: No booking history found
 */
router.post("/recommend", authenticate, recommend);

/**
 * @swagger
 * /ai/listings/{id}/review-summary:
 *   get:
 *     summary: AI-generated review summary for a listing
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Structured review summary
 *       400:
 *         description: Not enough reviews
 *       404:
 *         description: Listing not found
 */
router.get("/listings/:id/review-summary", reviewSummary);

export default router;
