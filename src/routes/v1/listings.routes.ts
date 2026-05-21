import { Router } from "express";
import { authenticate, requireHost } from "../../middlewares/auth.middleware";
import {
  getAllListings,
  searchListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing
} from "../../controllers/listings.controller";
import { getListingStats } from "../../controllers/stats.controller";

const router = Router();

/**
 * @swagger
 * /listings/stats:
 *   get:
 *     summary: Get listing statistics
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Listing stats
 */
router.get("/stats", getListingStats);

/**
 * @swagger
 * /listings/search:
 *   get:
 *     summary: Search listings
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Filtered listings
 */
router.get("/search", searchListings);

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
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
 *     responses:
 *       200:
 *         description: List of all listings
 */
router.get("/", getAllListings);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing found
 *       404:
 *         description: Listing not found
 */
router.get("/:id", getListingById);

/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing (hosts only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, location, pricePerNight, guests, type]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Cozy Apartment in Kigali
 *               description:
 *                 type: string
 *                 example: A beautiful apartment in the heart of Kigali
 *               location:
 *                 type: string
 *                 example: Kigali, Rwanda
 *               pricePerNight:
 *                 type: number
 *                 example: 80
 *               guests:
 *                 type: integer
 *                 example: 2
 *               type:
 *                 type: string
 *                 enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *                 example: APARTMENT
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["wifi", "kitchen", "parking"]
 *     responses:
 *       201:
 *         description: Listing created
 *       403:
 *         description: Hosts only
 */
router.post("/", authenticate, requireHost, createListing);

/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               pricePerNight:
 *                 type: number
 *               guests:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Listing updated
 *       404:
 *         description: Listing not found
 */
router.put("/:id", authenticate, updateListing);

/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing deleted
 *       404:
 *         description: Listing not found
 */
router.delete("/:id", authenticate, deleteListing);

export default router;