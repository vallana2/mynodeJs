import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { listings: true }
        }
      }
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: { listings: true, bookings: true }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, username, phone, password, role, avatar, bio } = req.body;

    if (!name || !email || !username || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, username, phone, password: hashedPassword, role, avatar, bio }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Email or username already exists" });
      }
    }
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findFirst({ where: { id } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    const user = await prisma.user.update({
      where: { id },
      data: req.body
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findFirst({ where: { id } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserListings = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findFirst({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const listings = await prisma.listing.findMany({ where: { hostId: id } });
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findFirst({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const bookings = await prisma.booking.findMany({
      where: { guestId: id },
      include: { listing: true }
    });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};