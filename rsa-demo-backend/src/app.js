require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const crypto = require("crypto");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/error.middleware");
const logger = require("./utils/logger.util");
const { initSocketIO } = require("./services/socket.service");

// ── Startup Guard ──
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    logger.error(`CRITICAL STARTUP ERROR: Missing environment variable [${key}]`);
    process.exit(1);
  }
});

// ── Route imports ──
const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/message.routes");
const userRoutes = require("./routes/user.routes");
const contactRoutes = require("./routes/contact.routes");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

/* ═══════════════════════════════════════════
   SOCKET.IO INITIALIZATION
   ═══════════════════════════════════════════ */

const io = initSocketIO(server);
app.set("io", io); // Make io accessible in controllers via req.app.get("io")

/* ═══════════════════════════════════════════
   GLOBAL MIDDLEWARE
   ═══════════════════════════════════════════ */

// a. Secure HTTP headers
app.use(helmet());

// CORS — restrict to known frontend origin in production
const corsOptions = {
  origin: function (origin, callback) {
    const allowed = [process.env.FRONTEND_URL, "https://rsa-signature-working.vercel.app"].filter(Boolean);
    // Allow if no origin (server-to-server), if in allowed list, or if wildcard set
    if (!origin || allowed.includes(origin) || process.env.FRONTEND_URL === "*") {
      callback(null, true);
    } else {
      logger.warn(`CORS BLOCKED: Incoming origin [${origin}] is not in allowed list:`, allowed);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  credentials: true,
  maxAge: 86400,
};

app.use((req, res, next) => {
  if (req.method !== "OPTIONS") {
    logger.info(`${req.method} ${req.url} - Origin: ${req.headers.origin || "None"}`);
  }
  next();
});

app.use(cors(corsOptions));

// Request logging — use 'combined' in production, 'dev' otherwise
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// c. Body parser — default 10kb for lightweight routes
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// d. X-Request-Id header for traceability
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
});

// Higher body limit for routes that carry PEM keys & ciphertexts
const largeBodyParser = express.json({ limit: "50kb" });

/* ═══════════════════════════════════════════
   HEALTH CHECK
   ═══════════════════════════════════════════ */

app.get("/health", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
        ? "connecting"
        : "disconnected";

  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    websocket: "enabled",
  });
});

/* ═══════════════════════════════════════════
   API ROUTES
   ═══════════════════════════════════════════ */

app.use("/api/auth", authRoutes);
app.use("/api/messages", largeBodyParser, messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);

/* ═══════════════════════════════════════════
   404 HANDLER
   ═══════════════════════════════════════════ */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
    data: null,
  });
});

/* ═══════════════════════════════════════════
   GLOBAL ERROR HANDLER (must be last)
   ═══════════════════════════════════════════ */

app.use(errorHandler);

/* ═══════════════════════════════════════════
   START SERVER
   ═══════════════════════════════════════════ */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Use server.listen (not app.listen) so Socket.io shares the same port
    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
      logger.info("─── Available Routes ───");
      logger.info("  POST   /api/auth/signup              (rate limited)");
      logger.info("  POST   /api/auth/login               (rate limited)");
      logger.info("  POST   /api/auth/google              (rate limited)");
      logger.info("  POST   /api/auth/forgot-password     (rate limited)");
      logger.info("  POST   /api/auth/reset-password/:t   (rate limited)");
      logger.info("  GET    /api/auth/me                  (protected)");
      logger.info("  POST   /api/messages/send            (protected)");
      logger.info("  GET    /api/messages/inbox            (protected)");
      logger.info("  GET    /api/messages/sent             (protected)");
      logger.info("  GET    /api/messages/conversation/:id (protected)");
      logger.info("  PATCH  /api/messages/:id/verify       (protected)");
      logger.info("  DELETE /api/messages/:id              (protected)");
      logger.info("  GET    /api/users/list                (protected)");
      logger.info("  GET    /api/users/profile/:username   (protected)");
      logger.info("  PATCH  /api/users/profile             (protected)");
      logger.info("  PATCH  /api/users/change-password     (protected)");
      logger.info("  POST   /api/users/rotate-keys         (protected)");
      logger.info("  GET    /health");
      logger.info("  WS     Socket.io (auto-auth via JWT)");
      logger.info("────────────────────────");
    });

    // Handle server error (e.g. EADDRINUSE)
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        logger.error(`CRITICAL ERROR: Port ${PORT} is already in use.`);
        logger.error(`Solution: Kill the previous server or change PORT in .env`);
      } else {
        logger.error(`SERVER ERROR: ${err.message}`);
      }
      process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down gracefully...");
      io.close(); // Close Socket.io connections
      server.close(() => {
        mongoose.connection.close(false, () => {
          logger.info("MongoDB connection closed.");
          process.exit(0);
        });
      });
    });

    process.on("unhandledRejection", (err) => {
      logger.error(`UNHANDLED REJECTION! 💥 Shutting down...`);
      logger.error(err.name, err.message);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    logger.error(`STARTUP FAILED: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
