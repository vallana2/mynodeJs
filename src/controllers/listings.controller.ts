import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { ListingType } from "@prisma/client";

export const getAllListings = async (req: AuthRequest, res: Response) => {
  try {
    const { location, type, maxPrice, page, limit, sortBy, order } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const listings = await prisma.listing.findMany({
      where: {
        ...(location && {
          location: { contains: location as string, mode: "insensitive" }
        }),
        ...(type && { type: type as ListingType }),
        ...(maxPrice && { pricePerNight: { lte: Number(maxPrice) } })
      },
      include: {
        host: { select: { name: true, avatar: true } },
        photos: true
      },
      skip,
      take: limitNum,
      orderBy: sortBy ? { [sortBy as string]: order || "asc" } : undefined
    });

    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const searchListings = async (req: AuthRequest, res: Response) => {
  try {
    const { location, type, minPrice, maxPrice, guests, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};
    if (location) where.location = { contains: location as string, mode: "insensitive" };
    if (type) where.type = type;
    if (minPrice && maxPrice) where.pricePerNight = { gte: Number(minPrice), lte: Number(maxPrice) };
    else if (minPrice) where.pricePerNight = { gte: Number(minPrice) };
    else if (maxPrice) where.pricePerNight = { lte: Number(maxPrice) };
    if (guests) where.guests = { gte: Number(guests) };
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, include: { host: { select: { id: true, name: true, email: true } }, photos: true }, skip, take: limitNum, orderBy: { createdAt: "desc" } }),
      prisma.listing.count({ where })
    ]);
    res.status(200).json({ data: listings, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) { console.log(error); res.status(500).json({ message: "Something went wrong" }); }
};

export const getListingById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { host: true, bookings: true, photos: true }
    });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.status(200).json(listing);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const hostId = req.userId!;

    const { title, description, location, pricePerNight, guests, type, amenities } = req.body;

    if (!title || !description || !location || !pricePerNight || !guests || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const validTypes: ListingType[] = ["APARTMENT", "HOUSE", "VILLA", "CABIN"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid listing type. Must be APARTMENT, HOUSE, VILLA, or CABIN" });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        pricePerNight: Number(pricePerNight),
        guests: Number(guests),
        type: type as ListingType,
        amenities: amenities ?? [],
        hostId
      }
    });

    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.listing.findFirst({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Listing not found" });

    if (existing.hostId !== req.userId && req.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only edit your own listings" });
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: req.body
    });
    res.status(200).json(listing);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.listing.findFirst({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Listing not found" });

    if (existing.hostId !== req.userId && req.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only delete your own listings" });
    }

    await prisma.listing.delete({ where: { id } });
    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};


