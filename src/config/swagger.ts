import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airbnb API",
      version: "1.0.0",
      description: "A RESTful API for an Airbnb-like platform. Supports user authentication, listings, bookings, reviews, and image uploads."
    },
    servers: [{ url: (process.env["API_URL"] || "http://localhost:3000") + "/api/v1" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        RegisterInput: {
          type: "object",
          required: ["name", "email", "username", "phone", "password"],
          properties: {
            name:     { type: "string", example: "Alice Johnson" },
            email:    { type: "string", example: "alice@example.com" },
            username: { type: "string", example: "alicejohnson" },
            phone:    { type: "string", example: "1234567890" },
            password: { type: "string", example: "password123", minLength: 8 },
            role:     { type: "string", enum: ["GUEST", "HOST"], example: "GUEST" },
            bio:      { type: "string", example: "Love traveling!" }
          }
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email:    { type: "string", example: "alice@example.com" },
            password: { type: "string", example: "password123" }
          }
        },
        CreateBookingInput: {
          type: "object",
          required: ["listingId", "checkIn", "checkOut"],
          properties: {
            listingId: { type: "string", example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d" },
            checkIn:   { type: "string", format: "date", example: "2026-06-01" },
            checkOut:  { type: "string", format: "date", example: "2026-06-07" }
          }
        }
      }
    }
  },
  apis: ["./src/routes/v1/*.ts"]
};

const spec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(spec);
  });
  console.log("Swagger docs available at http://localhost:3000/api-docs");
};