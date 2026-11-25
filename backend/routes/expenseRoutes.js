import express from "express";
import {
  addExpense,
  getAllExpenses,
  deleteExpense,
  downloadExpenseExcel,
} from "../controllers/expenseControllers.js";
import protect from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { addExpenseSchema, listExpenseSchema } from "../validation/expenseSchemas.js";

const router = express.Router();

router.get("/get", protect, validate(listExpenseSchema, "query"), getAllExpenses);
router.get("/downloadexcel", protect, downloadExpenseExcel);
router.post("/add", protect, validate(addExpenseSchema), addExpense);
router.delete("/:id", protect, deleteExpense);

export default router;
