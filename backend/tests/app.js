import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";

import authRoutes from "../routes/authRoutes.js";
import incomeRoutes from "../routes/incomeRoutes.js";
import expenseRoutes from "../routes/expenseRoutes.js";
import categoryRoutes from "../routes/categoryRoutes.js";
import dashboardRoutes from "../routes/dashboardRoutes.js";
import errorHandler from "../middleware/errorHandler.js";

const app = express();

app.use((req, _res, next) => { req.id = crypto.randomUUID(); next(); });
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) =>
  res.status(200).json({ status: "success" })
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use((_req, res) =>
  res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Route not found" })
);
app.use(errorHandler);

export default app;
