import express from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserInfo,
  uploadProfileImage,
  getProfileImage,
  forgotPassword,
  resetPassword,
} from "../controllers/authControllers.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validation/authSchemas.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.get("/getUser", protect, getUserInfo);

// Password reset (unauthenticated — user has lost access)
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);

// Profile image — authenticated, ownership enforced in controller
router.post(
  "/upload-image",
  protect,
  upload.single("image"),
  uploadProfileImage
);
router.get("/profile-image", protect, getProfileImage);

export default router;
