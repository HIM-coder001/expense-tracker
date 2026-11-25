import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(254, "Email too long"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),

  defaultCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Currency code must be 3 characters")
    .optional()
    .default("USD"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});
