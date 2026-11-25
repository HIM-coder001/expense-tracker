import logger from "../config/logger.js";

/**
 * Global error handler — must be registered LAST in server.js.
 * Hides stack traces and internal details in production.
 * Logs every error with the request ID so it can be correlated in logs.
 */
const errorHandler = (err, req, res, _next) => {
  const isDev = process.env.NODE_ENV !== "production";

  // Structured log — includes request ID for correlation
  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    requestId: req.id,
    code: err.code,
    status: err.status || err.statusCode || 500,
    ...(isDev && { stack: err.stack }),
  });

  // Multer file errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      status: "error",
      code: "FILE_TOO_LARGE",
      message: `File must be smaller than ${process.env.MAX_FILE_SIZE_MB || 5} MB`,
    });
  }

  if (err.code === "INVALID_FILE_TYPE") {
    return res.status(415).json({
      status: "error",
      code: "INVALID_FILE_TYPE",
      message: err.message,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Data validation failed",
      details,
    });
  }

  // Mongoose cast error (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      code: "INVALID_ID",
      message: "Invalid resource ID format",
    });
  }

  // Duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      status: "error",
      code: "DUPLICATE_KEY",
      message: "A resource with that value already exists",
    });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    status: "error",
    code: "INTERNAL_ERROR",
    message: isDev ? err.message : "An unexpected error occurred",
    ...(isDev && { stack: err.stack }),
  });
};

export default errorHandler;
