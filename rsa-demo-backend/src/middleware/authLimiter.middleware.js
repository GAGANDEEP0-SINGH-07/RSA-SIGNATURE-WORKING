const rateLimit = require("express-rate-limit");

/**
 * Limit password-sensitive requests to 1000 per 15 minutes.
 * 
 * NOTE: `validate: { xForwardedForHeader: false }` is REQUIRED for Render.
 * Render's reverse proxy always sets X-Forwarded-For, and express-rate-limit v8+
 * throws a ValidationError if it detects the header without matching trust proxy config.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: "Too many login/signup attempts. Please try again after 15 minutes.",
    data: null,
  },
});

module.exports = authLimiter;
