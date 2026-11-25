import express from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../controllers/categoryControllers.js";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createCategorySchema } from "../validation/categorySchemas.js";

const router = express.Router();

router.get("/", protect, getCategories);
router.post("/", protect, validate(createCategorySchema), createCategory);
router.delete("/:id", protect, deleteCategory);

export default router;
