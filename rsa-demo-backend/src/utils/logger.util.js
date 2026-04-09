/**
 * Lightweight logger utility.
 * Wraps console methods so they can be swapped for a real logger (e.g. winston)
 * in the future without touching every call-site.
 */

const isDev = () => process.env.NODE_ENV !== "production";

const logger = {
  info: (...args) => console.log("[INFO]", new Date().toISOString(), ...args),
  warn: (...args) => console.warn("[WARN]", new Date().toISOString(), ...args),
  error: (...args) =>
    console.error("[ERROR]", new Date().toISOString(), ...args),
  debug: (...args) => {
    if (isDev()) {
      console.debug("[DEBUG]", new Date().toISOString(), ...args);
    }
  },
};

module.exports = logger;
