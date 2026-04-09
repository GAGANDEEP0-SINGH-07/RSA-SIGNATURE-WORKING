const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

/**
 * @typedef {Object} UserDocument
 * @property {string}  username   – Unique display name (lowercase, trimmed).
 * @property {string}  password   – Bcrypt-hashed password (never returned by default).
 * @property {string}  publicKey  – PEM-encoded RSA public key shared with other users.
 * @property {string}  privateKey – PEM-encoded RSA private key (never returned by default).
 * @property {Date}    createdAt  – Auto-managed by Mongoose timestamps.
 * @property {Date}    updatedAt  – Auto-managed by Mongoose timestamps.
 */

const userSchema = new mongoose.Schema(
  {
    /**
     * Unique login / display name.
     * Stored in lowercase and trimmed to prevent duplicates
     * that differ only by casing or whitespace.
     */
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters."],
      maxlength: [20, "Username cannot exceed 20 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    /**
     * User password – stored as a bcrypt hash.
     * The `select: false` flag ensures it is never included in
     * query results unless explicitly requested with `.select("+password")`.
     */
    password: {
      type: String,
      required: [
        function () {
          return this.authProvider === "local";
        },
        "Password is required for local authentication.",
      ],
      minlength: [6, "Password must be at least 6 characters."],
      select: false,
    },

    /**
     * PEM-formatted RSA public key.
     * Distributed to other users so they can encrypt messages
     * destined for this user and verify signatures made by this user.
     */
    publicKey: {
      type: String,
      required: [true, "Public key is required."],
    },

    /**
     * PEM-formatted RSA private key.
     * Used by this user to decrypt incoming messages and to
     * create digital signatures.
     * `select: false` prevents accidental leakage through queries.
     */
    privateKey: {
      type: String,
      required: [true, "Private key is required."],
      select: false,
    },

    /**
     * Short user biography for profile display.
     */
    bio: {
      type: String,
      maxlength: [200, "Bio cannot exceed 200 characters."],
      default: "",
    },

    /**
     * Whether the user is currently connected via WebSocket.
     */
    isOnline: {
      type: Boolean,
      default: false,
    },

    /**
     * Timestamp of the user's last WebSocket disconnection.
     */
    lastSeen: {
      type: Date,
      default: Date.now,
    },

    /**
     * List of contacts added by this user via their unique ID.
     */
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /**
     * Hashed password-reset token (SHA-256 of the plain token).
     */
    passwordResetToken: {
      type: String,
      select: false,
    },

    /**
     * Expiry date for the password-reset token.
     */
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

/* ────────────────────────────────────────────
   Pre-save hook – hash password when modified
   ──────────────────────────────────────────── */

userSchema.pre("save", async function (next) {
  // Only hash if the password field was created or changed
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

/* ────────────────────────────────────────────
   Instance methods
   ──────────────────────────────────────────── */

/**
 * Compare a plaintext candidate password against the stored hash.
 * @param  {string}  candidatePassword – The plaintext password to check.
 * @returns {Promise<boolean>} `true` if the password matches.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Return a plain object representation of the user **without**
 * sensitive fields (password, privateKey).
 * Useful for API responses where you need a safe payload.
 * @returns {{ id: string, username: string, publicKey: string, createdAt: Date, updatedAt: Date }}
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    authProvider: this.authProvider,
    bio: this.bio,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    publicKey: this.publicKey,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

/**
 * Generate a cryptographically secure password reset token.
 * Stores a SHA-256 hash in the DB and returns the plain token
 * to be sent to the user via email.
 * Token expires in 10 minutes.
 * @returns {string} Plain (unhashed) reset token.
 */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
