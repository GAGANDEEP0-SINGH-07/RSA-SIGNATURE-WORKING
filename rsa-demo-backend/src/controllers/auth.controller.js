const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User.model");
const { generateRSAKeyPair } = require("../services/rsa.service");
const { sendPasswordResetEmail } = require("../services/email.service");
const { success, error } = require("../utils/response.util");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ─────────────────────────────────────
   POST /api/auth/signup
   ───────────────────────────────────── */

/**
 * Register a new user.
 *
 * INPUT : { username, password }
 * OUTPUT: 201 { username, publicKey, privateKey, id }
 *
 * Steps:
 *   a. Validate (handled by validate middleware)
 *   b. Check username not taken → 409
 *   c. Generate RSA key pair
 *   d. Create user (password auto-hashed via pre-save hook)
 *   e. Return user info including keys
 */
const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || username.trim().length < 3) {
      return error(res, "Username (Name) is required and must be at least 3 characters.", 400);
    }

    // b. Check email not already taken
    const existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      return error(res, "Email is already registered.", 409);
    }

    let generatedUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    let finalUsername = generatedUsername;
    let counter = 1;
    while (await User.exists({ username: finalUsername })) {
      finalUsername = `${generatedUsername}${counter}`;
      counter++;
    }

    // c. Generate RSA key pair
    const { publicKey, privateKey } = generateRSAKeyPair();

    // d. Create user — password hashed automatically by pre-save hook
    const user = await User.create({
      username: finalUsername,
      email: email.trim(),
      password,
      publicKey,
      privateKey,
    });

    // e. Automatically sign in after signup
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return success(
      res,
      {
        token,
        id: user._id,
        username: user.username,
        email: user.email,
        publicKey: user.publicKey,
        privateKey,
      },
      "User registered successfully.",
      201
    );
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────
   POST /api/auth/login
   ───────────────────────────────────── */

/**
 * Authenticate an existing user.
 *
 * INPUT : { username, password }
 * OUTPUT: 200 { token, user: { id, username, publicKey } }
 *
 * Steps:
 *   a. Validate (handled by validate middleware)
 *   b. Find user by username → 401 generic message
 *   c. Compare password → 401 generic message
 *   d. Generate JWT and return
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // b. Find user by email — select("+password") because it's excluded by default
    const emailStr = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailStr }).select("+password +privateKey");

    // Never reveal whether email or password was wrong
    if (!user) {
      return error(res, "Invalid email or password.", 401);
    }

    // Block login via password for Google-only accounts
    if (user.authProvider === "google" && !user.password) {
      return error(res, "This account uses Google Sign-In. Please log in with Google.", 401);
    }

    // c. Compare password using the instance method
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return error(res, "Invalid email or password.", 401);
    }

    // d. Generate JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return success(res, {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicKey: user.publicKey,
      },
      privateKey: user.privateKey,
    }, "Login successful.");
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────
   GET /api/auth/me   (protected)
   ───────────────────────────────────── */

/**
 * Return the currently authenticated user's profile.
 *
 * Uses toSafeObject() — no password, no privateKey.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return error(res, "User not found.", 404);
    }

    return success(res, { user: user.toSafeObject() }, "User profile fetched.");
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────
   POST /api/auth/google
   ───────────────────────────────────── */

/**
 * Handle Google OAuth Sign-In
 *
 * INPUT : { credential } (Google ID Token)
 * OUTPUT: 200 { token, user } OR 201 { token, user, privateKey } (if new)
 */
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return error(res, "Missing Google credential token.", 400);
    }

    // Verify token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Check if user exists by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists, just log them in (link googleId if missing)
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        await user.save();
      }

      const token = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      return success(
        res,
        { token, user: user.toSafeObject() },
        "Google login successful."
      );
    }

    // ── User does not exist, SIGN UP ──
    // Create base username from email handle
    let baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    
    // Ensure unique username
    let generatedUsername = baseUsername;
    let counter = 1;
    while (await User.exists({ username: generatedUsername })) {
      generatedUsername = `${baseUsername}${counter}`;
      counter++;
    }

    // Generate RSA keys
    const { publicKey, privateKey } = generateRSAKeyPair();

    // Create user
    user = await User.create({
      username: generatedUsername,
      email: email.toLowerCase(),
      authProvider: "google",
      googleId,
      publicKey,
      privateKey,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return success(
      res,
      {
        token,
        user: user.toSafeObject(),
        privateKey, // Only sent ONCE during initial Google signup!
      },
      "Google signup successful.",
      201
    );
  } catch (err) {
    if (
      err.message.includes("Token used too late") ||
      err.message.includes("Wrong recipient") ||
      err.message.includes("Wrong number of segments") ||
      err.message.includes("Invalid token")
    ) {
      return error(res, "Invalid, malformed, or expired Google token.", 401);
    }
    next(err);
  }
};

/* ─────────────────────────────────────
   POST /api/auth/forgot-password
   ───────────────────────────────────── */

/**
 * Request a password reset link.
 *
 * INPUT : { email }
 * OUTPUT: 200 with a generic message (never reveal if email exists)
 *
 * Steps:
 *   a. Find user by email
 *   b. Generate reset token via instance method
 *   c. Save user with hashed token + expiry
 *   d. Send reset email (or log to console in dev)
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, "Email address is required.", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Generic message — never reveal if the email exists
      return success(
        res,
        null,
        "If an account with that email exists, a password reset link has been sent."
      );
    }

    // Generate token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetToken, resetUrl);
    } catch (emailErr) {
      // If email fails, clear the token so they can try again
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return error(res, "Failed to send reset email. Please try again later.", 500);
    }

    return success(
      res,
      null,
      "If an account with that email exists, a password reset link has been sent."
    );
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────
   POST /api/auth/reset-password/:token
   ───────────────────────────────────── */

/**
 * Reset the user's password using a valid reset token.
 *
 * INPUT : { password } (the new password)
 * PARAM : :token (the plain reset token from the email link)
 *
 * Steps:
 *   a. Hash the incoming token and find a matching user
 *   b. Verify token hasn't expired
 *   c. Set new password and clear reset fields
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !/^[0-9a-f]{64}$/.test(token)) {
      return error(res, "Invalid token format.", 400);
    }

    if (!password || password.length < 6) {
      return error(res, "New password must be at least 6 characters.", 400);
    }

    // Hash the token to match what's stored in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return error(res, "Invalid or expired reset token.", 400);
    }

    // Set new password (pre-save hook will hash it)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return success(res, null, "Password has been reset successfully. You can now log in.");
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe, googleAuth, forgotPassword, resetPassword };
