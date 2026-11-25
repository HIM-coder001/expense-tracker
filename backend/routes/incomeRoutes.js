import express from "express";
import {
  addIncome,
  getAllIncome,
  deleteIncome,
  downloadIncomeExcel,
} from "../controllers/incomeControllers.js";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { addIncomeSchema, listIncomeSchema } from "../validation/incomeSchemas.js";

const router = express.Router();

router.get("/get", protect, validate(listIncomeSchema, "query"), getAllIncome);
router.get("/downloadexcel", protect, downloadIncomeExcel);
router.post("/add", protect, validate(addIncomeSchema), addIncome);
router.delete("/:id", protect, deleteIncome);

export default router;
