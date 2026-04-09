const { error } = require("../utils/response.util");

/**
 * Validation rule types:
 *
 * @typedef {Object} FieldRule
 * @property {boolean}  [required]  – Field must be present and non-empty.
 * @property {number}   [min]       – Minimum string length.
 * @property {number}   [max]       – Maximum string length.
 * @property {RegExp}   [pattern]   – Must match this regex.
 * @property {string}   [message]   – Custom error message for pattern failure.
 */

/**
 * Factory that returns Express middleware to validate `req.body`
 * against a rules-based schema object.
 *
 * @param {Record<string, FieldRule>} schema
 *   Keys   = field names to validate in req.body
 *   Values = rule objects defining constraints
 *
 * @returns {import("express").RequestHandler}
 *
 * @example
 *   const signupSchema = {
 *     username: { required: true, min: 3, max: 20, pattern: /^[a-zA-Z0-9_]+$/ },
 *     password: { required: true, min: 6 },
 *   };
 *   router.post("/signup", validate(signupSchema), signup);
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validatedData = {};
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const raw = req.body[field];
      const value = typeof raw === "string" ? raw.trim() : raw;

      // ── required ──
      if (rules.required) {
        if (value === undefined || value === null || value === "") {
          errors.push(`${field} is required.`);
          continue;
        }
      } else if (value === undefined || value === null || value === "") {
        continue;
      }

      // ── type check (all current schema rules expect strings) ──
      if (typeof value !== "string") {
        errors.push(`${field} must be a string.`);
        continue;
      }

      // ── min length ──
      if (rules.min !== undefined && value.length < rules.min) {
        errors.push(`${field} must be at least ${rules.min} characters.`);
      }

      // ── max length ──
      if (rules.max !== undefined && value.length > rules.max) {
        errors.push(`${field} must not exceed ${rules.max} characters.`);
      }

      // ── pattern ──
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(
          rules.message || `${field} contains invalid characters.`
        );
      }

      // If we reach here, the field is valid
      validatedData[field] = value;
    }

    if (errors.length > 0) {
      return error(res, errors.join(" "), 400);
    }

    // Replace req.body with only validated fields (prevents mass assignment)
    req.body = validatedData;
    next();
  };
};

/* ─────────────────────────────────────
   Pre-built schemas for auth routes
   ───────────────────────────────────── */

const signupSchema = {
  username: {
    required: true,
    min: 3,
  },
  email: {
    required: true,
    max: 100,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: "A valid email address is required.",
  },
  password: {
    required: true,
    min: 6,
  },
};

const loginSchema = {
  email: { required: true, pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: "A valid email address is required." },
  password: { required: true },
};

const sendMessageSchema = {
  receiverUsername: { required: true, min: 3, max: 20 },
  message: { required: true, min: 1 },
  senderPrivateKey: { required: true, min: 20 }, // PEM key is long
};

const updateProfileSchema = {
  username: {
    required: false,
    min: 3,
    max: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: "Username must be alphanumeric (letters, numbers, underscores).",
  },
  email: {
    required: false,
    max: 100,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: "A valid email address is required.",
  },
  bio: {
    required: false,
    max: 200,
  },
};

const changePasswordSchema = {
  currentPassword: { required: true, min: 1 },
  newPassword: { required: true, min: 6 },
};

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  sendMessageSchema,
  updateProfileSchema,
  changePasswordSchema,
};
