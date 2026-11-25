/**
 * Minimal structured logger.
 *
 * Outputs JSON lines in production so they can be ingested by any log
 * aggregator (Datadog, Logtail, CloudWatch, etc.).
 * In development it uses a human-readable format.
 *
 * Usage:
 *   import logger from "./config/logger.js";
 *   logger.info("Server started", { port: 5000 });
 *   logger.error("DB connection failed", { err: error.message });
 */

const isDev = process.env.NODE_ENV !== "production";

const LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const COLORS = {
  error: "\x1b[31m", // red
  warn:  "\x1b[33m", // yellow
  info:  "\x1b[36m", // cyan
  http:  "\x1b[35m", // magenta
  debug: "\x1b[90m", // grey
  reset: "\x1b[0m",
};

const log = (level, message, meta = {}) => {
  if (isDev) {
    const c = COLORS[level] || "";
    const r = COLORS.reset;
    const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    const metaStr = Object.keys(meta).length
      ? " " + JSON.stringify(meta)
      : "";
    // eslint-disable-next-line no-console
    console.log(`${c}[${ts}] ${level.toUpperCase().padEnd(5)} ${message}${metaStr}${r}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level,
        message,
        ...meta,
      })
    );
  }
};

const logger = {
  error: (msg, meta) => log("error", msg, meta),
  warn:  (msg, meta) => log("warn",  msg, meta),
  info:  (msg, meta) => log("info",  msg, meta),
  http:  (msg, meta) => log("http",  msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};

export default logger;
