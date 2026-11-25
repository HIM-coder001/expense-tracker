import rateLimit from "express-rate-limit";

const rateLimitMessage = (msg) => ({
  status: "error",
  code: "RATE_LIMITED",
  message: msg,
});

// 20 attempts per 15 minutes — login and register
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Too many requests, please try again later"),
});

// 5 per hour — forgot-password prevents email flooding and enumeration
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Too many password reset requests, please try again in an hour"),
});

// 300 per 15 minutes — general API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Too many requests, please try again later"),
});
