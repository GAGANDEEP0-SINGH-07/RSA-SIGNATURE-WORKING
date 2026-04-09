const mongoose = require("mongoose");
const User = require("../models/User.model");
const { generateRSAKeyPair } = require("../services/rsa.service");
const { success, error } = require("../utils/response.util");

/* ══════════════════════════════════════════
   1. GET /api/users/list
   ══════════════════════════════════════════ */

/**
 * Return all registered users except the logged-in user.
 * Only exposes safe fields: id, username, publicKey, bio, isOnline, lastSeen.
 *
 * Useful for the frontend to build a "pick a receiver" list.
 */
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    // Optional search filter — case-insensitive prefix match on username
    const searchQuery = req.query.search ? req.query.search.trim() : "";

    const filter = {
      _id: { $ne: req.user.userId },
      ...(searchQuery && {
        username: { $regex: `^${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, $options: "i" },
      }),
    };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("username email publicKey bio isOnline lastSeen")
        .sort({ username: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const list = users.map((u) => ({
      id: u._id,         // MongoDB unique _id — use this to search/identify users
      username: u.username,
      email: u.email,
      publicKey: u.publicKey,
      bio: u.bio || "",
      isOnline: u.isOnline || false,
      lastSeen: u.lastSeen,
    }));

    return success(
      res,
      { count: list.length, total, page, limit, users: list },
      "User list fetched successfully."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   2. GET /api/users/profile/:username
   ══════════════════════════════════════════ */

/**
 * Fetch a user's public profile by username.
 */
const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: username.toLowerCase().trim(),
    })
      .select("username email bio publicKey isOnline lastSeen createdAt")
      .lean();

    if (!user) {
      return error(res, "User not found.", 404);
    }

    return success(
      res,
      {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          bio: user.bio || "",
          publicKey: user.publicKey,
          isOnline: user.isOnline || false,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      },
      "User profile fetched successfully."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   3. GET /api/users/search/:uniqueId
   ══════════════════════════════════════════ */

/**
 * Search a user by unique ID.
 * Returns username, uniqueId, profile picture (if any), and _id.
 */
const searchUser = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;

    if (!mongoose.isValidObjectId(uniqueId)) {
      return error(res, "Invalid unique ID format. Must be an ObjectId.", 400);
    }

    if (uniqueId === req.user.userId) {
      return error(res, "You cannot search yourself.", 400);
    }

    const user = await User.findById(uniqueId)
      .select("username _id")
      .lean();

    if (!user) {
      return error(res, "No user found with the provided unique ID.", 404);
    }

    return success(
      res,
      {
        user: {
          id: user._id,
          username: user.username,
        },
      },
      "User found successfully."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   4. PATCH /api/users/profile
   ══════════════════════════════════════════ */

/**
 * Update the logged-in user's profile.
 *
 * Allowed fields: username, email, bio
 * Only updates fields that are present in the request body.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { username, email, bio } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return error(res, "User not found.", 404);
    }

    // ── Check for duplicate username ──
    if (username && username.toLowerCase().trim() !== user.username) {
      const existingUsername = await User.findOne({
        username: username.toLowerCase().trim(),
        _id: { $ne: userId },
      });
      if (existingUsername) {
        return error(res, "Username is already taken.", 409);
      }
      user.username = username.trim();
    }

    // ── Check for duplicate email ──
    if (email && email.toLowerCase().trim() !== user.email) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: userId },
      });
      if (existingEmail) {
        return error(res, "Email is already registered.", 409);
      }
      user.email = email.trim();
    }

    // ── Bio ──
    if (bio !== undefined) {
      user.bio = bio;
    }

    await user.save();

    return success(
      res,
      { user: user.toSafeObject() },
      "Profile updated successfully."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   4. PATCH /api/users/change-password
   ══════════════════════════════════════════ */

/**
 * Change the logged-in user's password.
 *
 * INPUT: { currentPassword, newPassword }
 *
 * Verifies the current password before accepting the new one.
 * Only for local auth users.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return error(res, "Both currentPassword and newPassword are required.", 400);
    }

    if (newPassword.length < 6) {
      return error(res, "New password must be at least 6 characters.", 400);
    }

    const user = await User.findById(userId).select("+password +authProvider");
    if (!user) {
      return error(res, "User not found.", 404);
    }

    if (user.authProvider !== "local") {
      return error(res, "Password change is only available for local accounts.", 400);
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return error(res, "Current password is incorrect.", 401);
    }

    // Set new password (will be hashed by the pre-save hook)
    user.password = newPassword;
    await user.save();

    return success(res, null, "Password changed successfully.");
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   5. POST /api/users/rotate-keys
   ══════════════════════════════════════════ */

/**
 * Generate a new RSA key pair for the logged-in user.
 *
 * ⚠️ WARNING: This invalidates all previously encrypted messages
 *    that have not yet been decrypted by the user.
 *    The private key is returned ONE TIME only.
 */
const rotateKeys = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return error(res, "User not found.", 404);
    }

    // Generate new key pair
    const { publicKey, privateKey } = generateRSAKeyPair();

    user.publicKey = publicKey;
    user.privateKey = privateKey;
    await user.save();

    return success(
      res,
      {
        publicKey,
        privateKey, // ⚠️ Returned ONCE — client must store securely
      },
      "RSA keys rotated successfully. Store your new private key securely — it will not be shown again.",
      200
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, searchUser, getProfile, updateProfile, changePassword, rotateKeys };
