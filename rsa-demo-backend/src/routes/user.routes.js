const express = require("express");
const router = express.Router();

const {
  listUsers,
  searchUser,
  getProfile,
  updateProfile,
  changePassword,
  rotateKeys,
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const {
  validate,
  updateProfileSchema,
  changePasswordSchema,
} = require("../middleware/validate.middleware");

// All user routes require authentication
router.use(protect);

// GET    /api/users/list                → List all users except the logged-in user
router.get("/list", listUsers);

// GET    /api/users/search/:uniqueId    → Search a user by their unique ObjectId
router.get("/search/:uniqueId", searchUser);

// GET    /api/users/profile/:username   → Fetch a user's public profile
router.get("/profile/:username", getProfile);

// PATCH  /api/users/profile             → Update logged-in user's profile
router.patch("/profile", validate(updateProfileSchema), updateProfile);

// PATCH  /api/users/change-password     → Change password (local auth only)
router.patch("/change-password", validate(changePasswordSchema), changePassword);

// POST   /api/users/rotate-keys         → Generate new RSA key pair
router.post("/rotate-keys", rotateKeys);

module.exports = router;
