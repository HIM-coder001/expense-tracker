import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";
import crypto from "crypto";

import connectDB from "./config/db.js";
import logger from "./config/logger.js";
import { authLimiter, forgotPasswordLimiter, apiLimiter } from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// Attach a unique ID to every request for log correlation
app.use((req, _res, next) => {
  req.id = crypto.randomUUID();
  next();
});

// HTTP request logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim(), { type: "http" }) },
  }));
}

app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(cookieParser());

// NoSQL injection prevention — strips keys starting with '$' or containing '.'
// from req.body and req.params. Query strings are covered by Zod validation.
const sanitizeObj = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else {
      sanitizeObj(obj[key]);
    }
  }
};
app.use((req, _res, next) => {
  sanitizeObj(req.body);
  sanitizeObj(req.params);
  next();
});

// Rate limiting
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/v1", apiLimiter);

// Health check
app.get("/api/v1/health", (_req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.status(200).json({
    status: "success",
    uptime: process.uptime(),
    db: states[mongoose.connection.readyState] || "unknown",
  });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/categories", categoryRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
      port: PORT,
      env: process.env.NODE_ENV || "development",
    });
  });
};

start();
