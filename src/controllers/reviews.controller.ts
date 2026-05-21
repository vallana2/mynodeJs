import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { getCache, setCache, clearCacheByPrefix } from "../config/cache";

export const getListingReviews = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `reviews:${listingId}:${page}:${limit}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { listingId },
        include: {
          user: { select: { id: true, name: true, avatar: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.review.count({ where: { listingId } })
    ]);

    const result = {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };

    setCache(cacheKey, result, 30);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = req.params.id as string;
    const { userId, rating, comment } = req.body;

    if (!userId || !rating || !comment) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        userId: String(userId),
        listingId
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    clearCacheByPrefix(`reviews:${listingId}`);
    clearCacheByPrefix(`ai:review-summary:${listingId}`);

    res.status(201).json(review);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ message: "Review not found" });

    await prisma.review.delete({ where: { id } });

    clearCacheByPrefix(`reviews:${review.listingId}`);
    clearCacheByPrefix(`ai:review-summary:${review.listingId}`);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
