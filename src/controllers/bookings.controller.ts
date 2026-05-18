import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { sendEmail } from "../config/email";
import { bookingConfirmationEmail, bookingCancellationEmail } from "../templates/emails";

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { listing: true, guest: true }
    });
    res.status(200).json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true, guest: true }
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const guestId = req.userId!;
    const { listingId, checkIn, checkOut } = req.body;

    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: "checkIn must be before checkOut" });
    }

    if (checkInDate <= new Date()) {
      return res.status(400).json({ message: "checkIn must be in the future" });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const conflict = await prisma.booking.findFirst({
      where: {
        listingId,
        status: "CONFIRMED",
        AND: [
          { checkIn: { lt: checkOutDate } },
          { checkOut: { gt: checkInDate } }
        ]
      }
    });
    if (conflict) {
      return res.status(409).json({ message: "Listing is already booked for these dates" });
    }

    const days = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = days * listing.pricePerNight;

    const booking = await prisma.booking.create({
      data: {
        guestId,
        listingId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        status: "PENDING"
      }
    });

    // Send confirmation email — never block the 201 response if it fails
    try {
      const guest = await prisma.user.findUnique({ where: { id: guestId } });
      if (guest) {
        await sendEmail(
          guest.email,
          `Booking confirmed: ${listing.title}`,
          bookingConfirmationEmail(
            guest.name,
            listing.title,
            listing.location,
            formatDate(checkInDate),
            formatDate(checkOutDate),
            totalPrice
          )
        );
      }
    } catch (emailError) {
      console.log("Booking confirmation email failed:", emailError);
    }

    res.status(201).json(booking);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true }
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.guestId !== req.userId && req.role !== "ADMIN") {
      return res.status(403).json({ message: "You can only cancel your own bookings" });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    // Send cancellation email — never block the 200 response if it fails
    try {
      const guest = await prisma.user.findUnique({ where: { id: booking.guestId } });
      if (guest) {
        await sendEmail(
          guest.email,
          `Booking cancelled: ${booking.listing.title}`,
          bookingCancellationEmail(
            guest.name,
            booking.listing.title,
            formatDate(booking.checkIn),
            formatDate(booking.checkOut)
          )
        );
      }
    } catch (emailError) {
      console.log("Cancellation email failed:", emailError);
    }

    res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const updated = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

