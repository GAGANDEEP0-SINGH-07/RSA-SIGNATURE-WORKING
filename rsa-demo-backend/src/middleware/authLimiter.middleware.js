const rateLimit = require("express-rate-limit");

/**
 * Limit password-sensitive requests to 10 per 15 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login/signup attempts. Please try again after 15 minutes.",
    data: null,
  },
});

module.exports = authLimiter;
