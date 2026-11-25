import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: "Category name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(50, "Name cannot exceed 50 characters"),

  icon: z
    .string()
    .trim()
    .max(10, "Icon cannot exceed 10 characters")
    .optional()
    .default("📦"),

  type: z
    .enum(["income", "expense", "both"], {
      errorMap: () => ({ message: 'Type must be "income", "expense", or "both"' }),
    })
    .optional()
    .default("both"),
});
