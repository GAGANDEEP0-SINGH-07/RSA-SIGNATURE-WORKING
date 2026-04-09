const express = require("express");
const router = express.Router();

const { signup, login, getMe, googleAuth, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const authLimiter = require("../middleware/authLimiter.middleware");
const { protect } = require("../middleware/auth.middleware");
const {
  validate,
  signupSchema,
  loginSchema,
} = require("../middleware/validate.middleware");

// ── Public routes ──
router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/google", authLimiter, googleAuth);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

// ── Protected routes ──
router.get("/me", protect, getMe);

module.exports = router;
