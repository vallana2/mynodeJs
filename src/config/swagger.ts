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
