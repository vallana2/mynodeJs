import "dotenv/config";

import express, { Request, Response, NextFunction } from "express";

import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import listingsRoutes from "./routes/listings.routes";
import bookingsRoutes from "./routes/bookings.routes";
import uploadRoutes from "./routes/upload.routes";

import { connectDB } from "./config/prisma";

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/listings", listingsRoutes);
app.use("/bookings", bookingsRoutes);

// Upload routes split across /users (avatar) and /listings (photos)
// The upload router handles both /:id/avatar and /:id/photos
app.use("/users", uploadRoutes);
app.use("/listings", uploadRoutes);

// Multer error handler — catches file type and size limit errors
// Must be defined after routes and have all 4 parameters to work as an error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === "Only jpeg, png, webp allowed") {
    return res.status(400).json({ message: err.message });
  }
  if (err.message.includes("File too large")) {
    return res.status(400).json({ message: "File exceeds 5MB limit" });
  }
  res.status(500).json({ message: "Something went wrong" });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

const PORT = process.env["PORT"] || 3000;

async function main() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main();
