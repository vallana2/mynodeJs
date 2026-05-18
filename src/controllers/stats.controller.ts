import { Request, Response } from "express";
import prisma from "../config/prisma";
import { getCache, setCache } from "../config/cache";

export const getListingStats = async (_req: Request, res: Response) => {
  try {
    const cacheKey = "stats:listings";
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // All queries run in parallel — no sequential queries
    const [totalListings, avgPrice, byLocation, byType] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.aggregate({ _avg: { pricePerNight: true } }),
      prisma.listing.groupBy({ by: ["location"], _count: { location: true } }),
      prisma.listing.groupBy({ by: ["type"], _count: { type: true } })
    ]);

    const result = {
      totalListings,
      averagePrice: avgPrice._avg.pricePerNight ?? 0,
      byLocation,
      byType
    };

    setCache(cacheKey, result, 5 * 60); // cache for 5 minutes
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserStats = async (_req: Request, res: Response) => {
  try {
    const cacheKey = "stats:users";
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const [totalUsers, byRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["role"], _count: { role: true } })
    ]);

    const result = { totalUsers, byRole };

    setCache(cacheKey, result, 5 * 60); // cache for 5 minutes
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
