import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { sendEmail } from "../config/email.js";
import logger from "../config/logger.js";
import path from "path";
import fs from "fs";

// ─── Token helpers ────────────────────────────────────────────────────────────

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

const generateRefreshToken = () => crypto.randomBytes(64).toString("hex");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth",
};

// Safe user shape — never expose password or internal fields
const safeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  profileImageUrl: user.profileImageUrl,
  defaultCurrency: user.defaultCurrency,
});

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUser = async (req, res) => {
  const { fullName, email, password, defaultCurrency } = req.body;

  try {
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({
        status: "error",
        code: "EMAIL_IN_USE",
        message: "An account with that email already exists",
      });
    }

    const user = await User.create({ fullName, email, password, defaultCurrency });
    logger.info("User registered", { userId: user._id, requestId: req.id });

    const accessToken = generateAccessToken(user._id);

    return res.status(201).json({
      status: "success",
      data: { token: accessToken, user: safeUser(user) },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        status: "error",
        code: "EMAIL_IN_USE",
        message: "An account with that email already exists",
      });
    }
    throw err;
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    logger.warn("Login failed — unknown email", { email, requestId: req.id });
    return res.status(401).json({
      status: "error",
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    logger.warn("Login failed — wrong password", { userId: user._id, requestId: req.id });
    return res.status(401).json({
      status: "error",
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  }

  const accessToken = generateAccessToken(user._id);
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({ userId: user._id, tokenHash, expiresAt });
  res.cookie("refreshToken", rawRefreshToken, REFRESH_COOKIE_OPTIONS);

  logger.info("User logged in", { userId: user._id, requestId: req.id });

  return res.status(200).json({
    status: "success",
    data: { token: accessToken, user: safeUser(user) },
  });
};

// ─── Refresh token ────────────────────────────────────────────────────────────

export const refreshAccessToken = async (req, res) => {
  const rawToken = req.cookies?.refreshToken;

  if (!rawToken) {
    return res.status(401).json({
      status: "error",
      code: "NO_REFRESH_TOKEN",
      message: "No refresh token",
    });
  }

  const tokenHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
    if (stored?.replacedByHash) {
      // Token reuse detected — revoke all sessions for this user
      logger.warn("Refresh token reuse detected", { userId: stored.userId });
      await RefreshToken.updateMany({ userId: stored.userId }, { isRevoked: true });
    }
    res.clearCookie("refreshToken", { path: "/api/v1/auth" });
    return res.status(401).json({
      status: "error",
      code: "INVALID_REFRESH_TOKEN",
      message: "Refresh token is invalid or expired",
    });
  }

  const newRawToken = generateRefreshToken();
  const newHash = hashToken(newRawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  stored.replacedByHash = newHash;
  stored.isRevoked = true;
  await stored.save();

  await RefreshToken.create({ userId: stored.userId, tokenHash: newHash, expiresAt });

  const accessToken = generateAccessToken(stored.userId);
  res.cookie("refreshToken", newRawToken, REFRESH_COOKIE_OPTIONS);

  return res.status(200).json({
    status: "success",
    data: { token: accessToken },
  });
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutUser = async (req, res) => {
  const rawToken = req.cookies?.refreshToken;

  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
  }

  res.clearCookie("refreshToken", { path: "/api/v1/auth" });
  return res.status(200).json({ status: "success", message: "Logged out" });
};

// ─── Get current user ─────────────────────────────────────────────────────────

export const getUserInfo = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password").lean();

  if (!user) {
    return res.status(404).json({
      status: "error",
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  return res.status(200).json({ status: "success", data: { user } });
};

// ─── Upload profile image ─────────────────────────────────────────────────────

export const uploadProfileImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      code: "NO_FILE",
      message: "No file uploaded",
    });
  }

  const user = await User.findById(req.user.id).select("profileImageUrl");
  if (user?.profileImageUrl) {
    const oldFilename = path.basename(user.profileImageUrl);
    const oldPath = path.resolve(
      process.env.UPLOAD_DIR || "private_uploads",
      oldFilename
    );
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { profileImageUrl: req.file.filename },
    { new: true, select: "-password" }
  ).lean();

  return res.status(200).json({
    status: "success",
    data: { profileImageUrl: req.file.filename, user: safeUser(updatedUser) },
  });
};

// ─── Serve profile image (authenticated + ownership-checked) ─────────────────

export const getProfileImage = async (req, res) => {
  const user = await User.findById(req.user.id).select("profileImageUrl").lean();

  if (!user?.profileImageUrl) {
    return res.status(404).json({
      status: "error",
      code: "NO_IMAGE",
      message: "No profile image on file",
    });
  }

  const filePath = path.resolve(
    process.env.UPLOAD_DIR || "private_uploads",
    user.profileImageUrl
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: "error",
      code: "FILE_NOT_FOUND",
      message: "Image file not found",
    });
  }

  return res.sendFile(filePath);
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Always return the same response — prevents user enumeration
  const genericResponse = () =>
    res.status(200).json({
      status: "success",
      message: "If that email is registered you will receive a reset link shortly",
    });

  const user = await User.findOne({ email });
  if (!user) return genericResponse();

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.passwordResetToken   = tokenHash;
  user.passwordResetExpires = expiresAt;
  await user.save({ validateModifiedOnly: true });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetLink = `${clientUrl}/reset-password/${rawToken}`;

  try {
    await sendEmail({
      to: email,
      subject: "Reset your ExpenseTracker password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#7c3aed">Reset your password</h2>
          <p>Hi ${user.fullName},</p>
          <p>Someone requested a password reset for your account.
             If this was you, click the button below.
             The link expires in <strong>1 hour</strong>.</p>
          <a href="${resetLink}"
             style="display:inline-block;background:#7c3aed;color:#fff;
                    padding:12px 24px;border-radius:8px;text-decoration:none;
                    font-weight:600;margin:16px 0">
            Reset Password
          </a>
          <p style="color:#64748b;font-size:13px">
            If you didn't request this, ignore this email — your password won't change.
          </p>
          <p style="color:#94a3b8;font-size:12px">
            Or copy this link: ${resetLink}
          </p>
        </div>
      `,
      text: `Reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
    });

    logger.info("Password reset email sent", { userId: user._id, requestId: req.id });
  } catch (emailErr) {
    // Don't expose email send failures to the caller — log internally and
    // still return the generic response so the UI isn't broken.
    logger.error("Failed to send password reset email", {
      userId: user._id,
      error: emailErr.message,
      requestId: req.id,
    });
  }

  return genericResponse();
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || typeof token !== "string" || token.length !== 64) {
    return res.status(400).json({
      status: "error",
      code: "INVALID_TOKEN",
      message: "Reset link is invalid or has expired",
    });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken:   tokenHash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({
      status: "error",
      code: "INVALID_TOKEN",
      message: "Reset link is invalid or has expired",
    });
  }

  // ── Reject if the new password is the same as the current one ────────────
  // We must compare against the stored hash BEFORE overwriting it.
  const isSamePassword = await bcrypt.compare(password, user.password);
  if (isSamePassword) {
    return res.status(400).json({
      status: "error",
      code: "SAME_PASSWORD",
      message: "New password must be different from your current password",
    });
  }

  // Set the new password — the pre-save hook hashes it
  user.password             = password;
  user.passwordResetToken   = null;
  user.passwordResetExpires = null;
  await user.save({ validateModifiedOnly: true });

  // Revoke all sessions so stolen sessions are killed immediately
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
  res.clearCookie("refreshToken", { path: "/api/v1/auth" });

  logger.info("Password reset completed", { userId: user._id, requestId: req.id });

  return res.status(200).json({
    status: "success",
    message: "Password updated successfully. Please log in with your new password.",
  });
};
