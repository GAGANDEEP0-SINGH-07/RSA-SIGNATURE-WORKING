/**
 * Standardised API response helpers.
 *
 * Every response follows this shape:
 *   { success: Boolean, message: String, data: Object|null }
 */

/**
 * Send a success response.
 * @param {import("express").Response} res
 * @param {Object|null}  data
 * @param {string}       message
 * @param {number}       statusCode  – default 200
 */
const success = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response.
 * @param {import("express").Response} res
 * @param {string} message
 * @param {number} statusCode – default 500
 */
const error = (res, message = "Internal Server Error", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

module.exports = { success, error };
