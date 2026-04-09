/**
 * Socket.io Real-Time Service
 *
 * Handles:
 *   - JWT-authenticated WebSocket connections
 *   - Online/offline user presence tracking
 *   - Typing indicators
 *   - Real-time message delivery events
 *
 * Events emitted to clients:
 *   - message:new          → a new encrypted message arrived
 *   - message:deleted       → a message was deleted
 *   - user:online           → a user came online
 *   - user:offline          → a user went offline
 *   - typing:start          → a user started typing to you
 *   - typing:stop           → a user stopped typing to you
 */

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User.model");
const logger = require("../utils/logger.util");

// Map<userId, Set<socketId>> — supports multiple tabs/devices
const onlineUsers = new Map();

/**
 * Initialise Socket.io on an existing HTTP server.
 *
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
const initSocketIO = (httpServer) => {
  // Build allowed origins from FRONTEND_URL env var
  const envUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
  const allowedOrigins = [envUrl].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const incoming = origin.replace(/\/$/, "");
        const isAllowed = allowedOrigins.some((o) => o === incoming) || process.env.FRONTEND_URL === "*";
        
        if (isAllowed) {
          callback(null, true);
        } else {
          logger.warn(`[Socket CORS Blocked]: ${origin}`);
          // Fallback to true if strictly debugging, but typically should block or mirror Express.
          // Since Express was super permissive (callback(null, isAllowed) but had a comment about allowing everything if "*"),
          // we strictly adhere to isAllowed.
          callback(null, isAllowed);
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Authentication middleware ──
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication required."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err) {
      logger.error(`[Socket] Auth failed: ${err.message}`);
      next(new Error("Invalid or expired token."));
    }
  });

  // ── Connection handler ──
  io.on("connection", async (socket) => {
    const { userId, username } = socket;
    logger.info(`[Socket] ${username} connected (socket: ${socket.id})`);

    // Track this socket
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Update DB presence (only on first connection for this user)
    if (onlineUsers.get(userId).size === 1) {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (dbErr) {
        logger.error(`[Socket] Failed to set online status: ${dbErr.message}`);
      }
      socket.broadcast.emit("user:online", { userId, username });
    }

    // ── Join a personal room for targeted messages ──
    socket.join(`user:${userId}`);

    // ── Typing indicators (validate receiverId before broadcasting) ──
    socket.on("typing:start", ({ receiverId }) => {
      if (!receiverId || !mongoose.isValidObjectId(receiverId)) return;
      if (receiverId === userId) return; // can't type to yourself
      io.to(`user:${receiverId}`).emit("typing:start", {
        userId,
        username,
      });
    });

    socket.on("typing:stop", ({ receiverId }) => {
      if (!receiverId || !mongoose.isValidObjectId(receiverId)) return;
      if (receiverId === userId) return;
      io.to(`user:${receiverId}`).emit("typing:stop", {
        userId,
        username,
      });
    });

    // ── Disconnect ──
    socket.on("disconnect", async () => {
      logger.info(`[Socket] ${username} disconnected (socket: ${socket.id})`);

      // Remove this specific socket
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // Only mark offline if ALL tabs/devices are gone
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          try {
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: new Date(),
            });
          } catch (dbErr) {
            logger.error(`[Socket] Failed to set offline status: ${dbErr.message}`);
          }
          socket.broadcast.emit("user:offline", {
            userId,
            username,
            lastSeen: new Date(),
          });
        }
      }
    });
  });

  logger.info("[Socket] Socket.io initialised");
  return io;
};

/* ══════════════════════════════════════════
   Helper functions for controllers
   ══════════════════════════════════════════ */

/**
 * Emit an event to a specific user (across all their connected devices).
 *
 * @param {import("socket.io").Server} io
 * @param {string} userId
 * @param {string} event
 * @param {Object} data
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Check if a user is currently online.
 * @param {string} userId
 * @returns {boolean}
 */
const isUserOnline = (userId) => {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};

/**
 * Get an array of all currently online user IDs.
 * @returns {string[]}
 */
const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = {
  initSocketIO,
  emitToUser,
  isUserOnline,
  getOnlineUserIds,
};
