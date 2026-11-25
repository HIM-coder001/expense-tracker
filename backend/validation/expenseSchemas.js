import { z } from "zod";

export const addExpenseSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title cannot exceed 100 characters"),

  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than zero")
    .finite("Amount must be a finite number"),

  date: z.string({ required_error: "Date is required" }).refine(
    (v) => !Number.isNaN(Date.parse(v)),
    "Date must be a valid date string"
  ),

  icon: z
    .string()
    .trim()
    .max(10, "Icon cannot exceed 10 characters")
    .optional()
    .default(""),

  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Currency code must be 3 characters")
    .optional(),

  categoryId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid category ID")
    .optional()
    .nullable(),
});

export const listExpenseSchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a number")
    .optional()
    .transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 20)),

  cursor: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid cursor")
    .optional(),

  categoryId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid category ID")
    .optional(),
});
