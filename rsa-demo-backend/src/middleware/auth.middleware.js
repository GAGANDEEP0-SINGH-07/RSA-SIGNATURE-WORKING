const jwt = require("jsonwebtoken");
const { error } = require("../utils/response.util");

/**
 * Express middleware – verifies the Bearer JWT from the Authorization header
 * and attaches `req.user = { userId, username }` on success.
 *
 * Error handling:
 *   - No token            → 401  "No token provided."
 *   - TokenExpiredError    → 401  "Token expired. Please login again."
 *   - JsonWebTokenError    → 401  "Invalid token."
 *   - Any other error      → 500
 */
const protect = (req, res, next) => {
  try {
    // 1. Read Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check format is "Bearer <token>"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, "No token provided.", 401);
    }

    const token = authHeader.split(" ")[1];

    // 3. Verify JWT using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach decoded payload to req.user
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    // 5. Call next()
    next();
  } catch (err) {
    // TokenExpiredError – token was valid but has expired
    if (err.name === "TokenExpiredError") {
      return error(res, "Token expired. Please login again.", 401);
    }

    // JsonWebTokenError – malformed / tampered token
    if (err.name === "JsonWebTokenError") {
      return error(res, "Invalid token.", 401);
    }

    // Any other unexpected error
    return error(res, "Internal server error.", 500);
  }
};

module.exports = { protect };
