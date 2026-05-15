import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { uploadToCloudinary, deleteFromCloudinary, getOptimizedUrl } from "../config/cloudinary";

const MAX_PHOTOS = 5;

// ── Avatar ────────────────────────────────────────────────────────────────────

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (req.userId !== id) {
      return res.status(403).json({ message: "You can only update your own avatar" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Always delete the old file from Cloudinary before uploading a new one
    // Without publicId you cannot delete — always store both url and publicId
    if (user.avatarPublicId) {
      try {
        await deleteFromCloudinary(user.avatarPublicId);
      } catch (err) {
        console.log("Failed to delete old avatar from Cloudinary:", err);
      }
    }

    const { url, publicId } = await uploadToCloudinary(req.file.buffer, "airbnb/avatars");

    const updated = await prisma.user.update({
      where: { id },
      data: { avatar: url, avatarPublicId: publicId }
    });

    const { password: _, ...userWithoutPassword } = updated;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (req.userId !== id) {
      return res.status(403).json({ message: "You can only update your own avatar" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.avatar) {
      return res.status(400).json({ message: "No avatar to remove" });
    }

    await deleteFromCloudinary(user.avatarPublicId as string);

    await prisma.user.update({
      where: { id },
      data: { avatar: null, avatarPublicId: null }
    });

    res.status(200).json({ message: "Avatar removed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ── Listing Photos ────────────────────────────────────────────────────────────

export const uploadListingPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.hostId !== req.userId) {
      return res.status(403).json({ message: "You can only upload photos to your own listings" });
    }

    const existingCount = await prisma.listingPhoto.count({ where: { listingId: id } });

    if (existingCount >= MAX_PHOTOS) {
      return res.status(400).json({ message: "Maximum of 5 photos allowed per listing" });
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Only process up to the remaining slots
    const remainingSlots = MAX_PHOTOS - existingCount;
    const filesToProcess = files.slice(0, remainingSlots);

    await Promise.all(
      filesToProcess.map(async (file) => {
        const { url, publicId } = await uploadToCloudinary(file.buffer, "airbnb/listings");
        return prisma.listingPhoto.create({
          data: { url, publicId, listingId: id }
        });
      })
    );

    const updatedListing = await prisma.listing.findUnique({
      where: { id },
      include: {
        photos: true,
        host: { select: { id: true, name: true } }
      }
    });

    // Return optimized URLs — serve correctly sized images, not full resolution
    const result = {
      ...updatedListing,
      photos: updatedListing!.photos.map((photo) => ({
        ...photo,
        url: getOptimizedUrl(photo.url, 800, 600)
      })),
      uploaded: filesToProcess.length,
      skipped: files.length - filesToProcess.length
    };

    res.status(201).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteListingPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const photoId = Number(req.params.photoId);

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.hostId !== req.userId) {
      return res.status(403).json({ message: "You can only delete photos from your own listings" });
    }

    const photo = await prisma.listingPhoto.findUnique({ where: { id: photoId } });
    if (!photo) return res.status(404).json({ message: "Photo not found" });

    // Verify photo belongs to this listing — prevents hosts deleting other listings' photos
    if (photo.listingId !== id) {
      return res.status(403).json({ message: "Photo does not belong to this listing" });
    }

    await deleteFromCloudinary(photo.publicId);
    await prisma.listingPhoto.delete({ where: { id: photoId } });

    res.status(200).json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};