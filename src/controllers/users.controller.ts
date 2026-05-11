import { Request, Response } from "express";
import { users, User } from "../models/user.model";

export const getAllUsers = (req: Request, res: Response) => {
  res.json(users);
};

export const getUserById = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
};

export const createUser = (req: Request, res: Response) => {
  const { name, email, username, phone, role, avatar, bio } = req.body;

  if (!name || !email || !username || !phone || !role) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  const newUser: User = {
    id: users.length + 1,
    name,
    email,
    username,
    phone,
    role,
    avatar,
    bio
  };

  users.push(newUser);

  res.status(201).json(newUser);
};

export const updateUser = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  Object.assign(user, req.body);

  res.json(user);
};

export const deleteUser = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  users.splice(index, 1);

  res.json({
    message: "User deleted successfully"
  });
};