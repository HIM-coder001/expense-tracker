import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES =
  (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5) * 1024 * 1024;

// Use env-configured upload directory (defaults to private_uploads).
// This folder is intentionally NOT served as a static route.
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "private_uploads");

// Ensure the directory exists on startup
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  // Random UUID filename removes original name from disk — prevents
  // path traversal via crafted filenames and avoids enumeration
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error("Only JPEG, PNG, and WebP images are allowed"), {
        code: "INVALID_FILE_TYPE",
      }),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
});

export default upload;
