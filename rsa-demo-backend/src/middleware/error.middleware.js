const logger = require("../utils/logger.util");

/**
 * Global Express error-handling middleware.
 *
 * Must have exactly 4 parameters so Express recognises it as
 * an error handler (even if `next` is unused).
 *
 * Handles:
 *   - Mongoose ValidationError   → 400 with field-level messages
 *   - Mongoose CastError         → 400 "Invalid ID"
 *   - Mongoose duplicate key     → 409 "Already exists"
 *   - JWT errors                 → 401
 *   - Default                    → 500 "Internal server error"
 *
 * Never exposes stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // ── Log in development ──
  if (process.env.NODE_ENV !== "production") {
    logger.error("────────── ERROR ──────────");
    logger.error(`${req.method} ${req.originalUrl}`);
    logger.error(err.stack || err.message);
    logger.error("───────────────────────────");
  } else {
    // In production, log just the message (no stack)
    logger.error(`${req.method} ${req.originalUrl} → ${err.message}`);
  }

  // ── Mongoose ValidationError ──
  // e.g. required field missing, minlength check failed
  if (err.name === "ValidationError") {
    const fieldErrors = Object.entries(err.errors).map(([field, e]) => ({
      field,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      data: { errors: fieldErrors },
    });
  }

  // ── Mongoose CastError (bad ObjectId) ──
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ID: "${err.value}" is not a valid ${err.kind}.`,
      data: null,
    });
  }

  // ── Mongoose duplicate key (code 11000) ──
  if (err.code === 11000) {
    const duplicatedFields = Object.keys(err.keyValue).join(", ");
    return res.status(409).json({
      success: false,
      message: `Already exists. Duplicate value for: ${duplicatedFields}.`,
      data: null,
    });
  }

  // ── JWT errors ──
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired. Please login again.",
      data: null,
    });
  }
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
      data: null,
    });
  }
  if (err.name === "NotBeforeError") {
    return res.status(401).json({
      success: false,
      message: "Token not yet valid.",
      data: null,
    });
  }

  // ── Crypto/RSA errors (malformed keys or payloads) ──
  if (err instanceof SyntaxError && err.message.includes("JSON") && (req.originalUrl.includes("messages") || req.originalUrl.includes("auth"))) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload or invalid cryptographic envelope.",
      data: null,
    });
  }

  if (err.message && (err.message.includes("DECODER routines") || err.message.includes("PEM_read_bio"))) {
    return res.status(400).json({
      success: false,
      message: "Invalid key format. Please provide a valid PEM string.",
      data: null,
    });
  }

  // ── Custom operational errors ──
  // Controllers can throw: const e = new Error("msg"); e.statusCode = 400; throw e;
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
  }

  // ── Default: 500 Internal Server Error ──
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : err.message || "Internal server error.",
    data: null,
  });
};

module.exports = errorHandler;
