import { Request, Response } from "express";
import { listings, Listing } from "../models/listing.model";

export const getAllListings = (req: Request, res: Response) => {
  res.json(listings);
};

export const getListingById = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return res.status(404).json({
      message: "Listing not found"
    });
  }

  res.json(listing);
};

export const createListing = (req: Request, res: Response) => {
  const {
    title,
    description,
    location,
    pricePerNight,
    guests,
    type,
    amenities,
    rating,
    host
  } = req.body;

  if (
    !title ||
    !description ||
    !location ||
    !pricePerNight ||
    !guests ||
    !type ||
    !amenities ||
    !host
  ) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  const newListing: Listing = {
    id: listings.length + 1,
    title,
    description,
    location,
    pricePerNight,
    guests,
    type,
    amenities,
    rating,
    host
  };

  listings.push(newListing);

  res.status(201).json(newListing);
};

export const updateListing = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return res.status(404).json({
      message: "Listing not found"
    });
  }

  Object.assign(listing, req.body);

  res.json(listing);
};

export const deleteListing = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const index = listings.findIndex((l) => l.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Listing not found"
    });
  }

  listings.splice(index, 1);

  res.json({
    message: "Listing deleted successfully"
  });
};