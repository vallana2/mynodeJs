import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import { setupSwagger } from "./config/swagger";
import { connectDB } from "./config/prisma";
import { generalLimiter, strictLimiter } from "./middlewares/rateLimiter";
import { deprecateV1 } from "./middlewares/deprecation.middleware";
import v1Router from "./routes/v1/index";
import uploadRoutes from "./routes/upload.routes";

const app = express();

// CORS — must be first
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.set("trust proxy", 1);

app.use(process.env["NODE_ENV"] === "production" ? morgan("combined") : morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(generalLimiter);
app.use("/api/v1/auth/register", strictLimiter);
app.use("/api/v1/auth/login", strictLimiter);

setupSwagger(app);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date() });
});

app.use("/api/v1", deprecateV1, v1Router);
app.use("/api/v1/users", uploadRoutes);
app.use("/api/v1/listings", uploadRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  if (err.message === "Only jpeg, png, webp allowed") {
    return res.status(400).json({ message: err.message });
  }
  if (err.message.includes("File too large")) {
    return res.status(400).json({ message: "File exceeds 5MB limit" });
  }
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = Number(process.env["PORT"]) || 3000;

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main();