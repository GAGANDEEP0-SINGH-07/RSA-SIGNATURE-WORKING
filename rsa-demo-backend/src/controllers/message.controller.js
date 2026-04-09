const mongoose = require("mongoose");
const Message = require("../models/Message.model");
const User = require("../models/User.model");
const rsaService = require("../services/rsa.service");
const { emitToUser } = require("../services/socket.service");
const { success, error } = require("../utils/response.util");

/* ══════════════════════════════════════════
   1. POST /api/messages/send
   ══════════════════════════════════════════ */

/**
 * Send an encrypted, signed message from the logged-in user to a receiver.
 *
 * INPUT: { receiverUsername, message, senderPrivateKey }
 *
 * Flow:
 *   a. Find receiver by username
 *   b. Block self-messaging
 *   c. Hash + sign the message with sender's private key
 *   d. Encrypt { message, signature } with receiver's public key (from DB)
 *   e. Save to Message collection
 *   f. Emit real-time event to receiver
 *   g. Return messageId, ciphertext, signature, hash
 */
const sendMessage = async (req, res, next) => {
  try {
    const { receiverUsername, message, senderPrivateKey } = req.body;

    // ── Validation ──
    if (!receiverUsername || typeof receiverUsername !== "string" || !receiverUsername.trim()) {
      return error(res, "receiverUsername is required.", 400);
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return error(res, "message is required.", 400);
    }
    if (!senderPrivateKey || typeof senderPrivateKey !== "string" || !senderPrivateKey.trim()) {
      return error(res, "senderPrivateKey is required.", 400);
    }

    // a. Find receiver by username
    const receiver = await User.findOne({
      username: receiverUsername.toLowerCase().trim(),
    });

    if (!receiver) {
      return error(res, "Receiver user not found.", 404);
    }

    // b. Cannot send to yourself
    if (receiver._id.toString() === req.user.userId) {
      return error(res, "You cannot send a message to yourself.", 400);
    }

    // c. Hash and sign the message using sender's private key
    const { hash, signature } = rsaService.signMessage(message, senderPrivateKey);

    // d. Encrypt { message, signature } using receiver's publicKey (from DB)
    const payload = JSON.stringify({ message, signature });
    const ciphertext = rsaService.encryptMessage(payload, receiver.publicKey);

    // d2. Encrypt for sender too (so they can see history)
    const sender = await User.findById(req.user.userId).select("publicKey");
    const senderCiphertext = rsaService.encryptMessage(payload, sender.publicKey);

    // e. Save to Message collection
    const savedMsg = await Message.create({
      sender: req.user.userId,
      receiver: receiver._id,
      ciphertext,
      senderCiphertext,
      signature,
      hash,
    });

    // f. Emit real-time event to receiver
    const io = req.app.get("io");
    if (io) {
      emitToUser(io, receiver._id.toString(), "message:new", {
        id: savedMsg._id,
        sender: {
          id: req.user.userId,
          username: req.user.username,
        },
        ciphertext,
        signature,
        hash,
        createdAt: savedMsg.createdAt,
      });
    }

    // g. Return result
    return success(
      res,
      {
        messageId: savedMsg._id,
        to: receiver.username,
        ciphertext,
        signature,
        hash,
        createdAt: savedMsg.createdAt,
      },
      "Secure message sent successfully.",
      201
    );
  } catch (err) {
    const errMsg = err?.message || "";
    // Catch invalid private key errors from signing
    if (
      errMsg.includes("PEM") ||
      errMsg.includes("key") ||
      err.code === "ERR_OSSL_EVP_BAD_DECRYPT"
    ) {
      return error(res, "Invalid senderPrivateKey format.", 400);
    }
    next(err);
  }
};

/* ══════════════════════════════════════════
   2. GET /api/messages/inbox
   ══════════════════════════════════════════ */

/**
 * Fetch all messages received by the logged-in user.
 *
 * Returns raw encrypted messages (no decryption here).
 * The client calls /open to decrypt individual messages.
 * Excludes messages soft-deleted by the receiver.
 */
const getInbox = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {
      receiver: req.user.userId,
      deletedByReceiver: false,
    };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate("sender", "username publicKey")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter),
    ]);

    const inbox = messages.map((msg) => ({
      id: msg._id,
      sender: {
        id: msg.sender._id,
        username: msg.sender.username,
        publicKey: msg.sender.publicKey,
      },
      ciphertext: msg.ciphertext,
      signature: msg.signature,
      hash: msg.hash,
      isVerified: msg.isVerified,
      createdAt: msg.createdAt,
    }));

    return success(
      res,
      { count: inbox.length, total, page, limit, inbox },
      "Inbox fetched successfully."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   3. GET /api/messages/sent
   ══════════════════════════════════════════ */

/**
 * Fetch all messages sent by the logged-in user.
 * Excludes messages soft-deleted by the sender.
 */
const getSent = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {
      sender: req.user.userId,
      deletedBySender: false,
    };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate("receiver", "username publicKey")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter),
    ]);

    const sent = messages.map((msg) => ({
      id: msg._id,
      receiver: {
        id: msg.receiver._id,
        username: msg.receiver.username,
        publicKey: msg.receiver.publicKey,
      },
      ciphertext: msg.ciphertext,
      signature: msg.signature,
      hash: msg.hash,
      isVerified: msg.isVerified,
      createdAt: msg.createdAt,
    }));

    return success(
      res,
      { count: sent.length, total, page, limit, sent },
      "Sent messages fetched successfully."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   4. GET /api/messages/conversation/:userId
   ══════════════════════════════════════════ */

/**
 * Fetch the full conversation between the logged-in user
 * and another user, sorted chronologically.
 * Excludes messages soft-deleted by the current user.
 */
const getConversation = async (req, res, next) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user.userId;

    if (!mongoose.isValidObjectId(otherUserId)) {
      return error(res, "Invalid user ID.", 400);
    }

    if (otherUserId === currentUserId) {
      return error(res, "Cannot fetch conversation with yourself.", 400);
    }

    // Find the other user to include their info
    const otherUser = await User.findById(otherUserId).select("username publicKey").lean();
    if (!otherUser) {
      return error(res, "User not found.", 404);
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        {
          sender: currentUserId,
          receiver: otherUserId,
          deletedBySender: false,
        },
        {
          sender: otherUserId,
          receiver: currentUserId,
          deletedByReceiver: false,
        },
      ],
    };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate("sender", "username publicKey")
        .populate("receiver", "username publicKey")
        .sort({ createdAt: 1 }) // oldest first for conversation view
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter),
    ]);

    const conversation = messages.map((msg) => ({
      id: msg._id,
      sender: {
        id: msg.sender._id,
        username: msg.sender.username,
        publicKey: msg.sender.publicKey,
      },
      receiver: {
        id: msg.receiver._id,
        username: msg.receiver.username,
        publicKey: msg.receiver.publicKey,
      },
      ciphertext: msg.ciphertext,
      signature: msg.signature,
      hash: msg.hash,
      isVerified: msg.isVerified,
      direction: msg.sender._id.toString() === currentUserId ? "sent" : "received",
      createdAt: msg.createdAt,
    }));

    return success(
      res,
      {
        otherUser: {
          id: otherUser._id,
          username: otherUser.username,
          publicKey: otherUser.publicKey,
        },
        count: conversation.length,
        total,
        page,
        limit,
        conversation,
      },
      "Conversation fetched successfully."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   5. PATCH /api/messages/:messageId/verify
   ══════════════════════════════════════════ */

/**
 * Mark a message as verified.
 * Decryption and cryptographic signature checks are executed entirely
 * on the client-side to enforce zero-knowledge Zero-Trust architecture.
 */
const markVerified = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.isValidObjectId(messageId)) {
      return error(res, "Invalid message ID.", 400);
    }

    const msg = await Message.findById(messageId);
    if (!msg) {
      return error(res, "Message not found.", 404);
    }

    if (msg.receiver.toString() !== req.user.userId) {
      return error(res, "Access denied. You are not the receiver of this message.", 403);
    }

    if (!msg.isVerified) {
      msg.isVerified = true;
      await msg.save();
    }

    return success(res, { isVerified: true }, "Message marked as verified securely.");
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   6. DELETE /api/messages/:messageId
   ══════════════════════════════════════════ */

/**
 * Soft-delete a message for the requesting user.
 *
 * - If sender requests deletion → sets `deletedBySender = true`
 * - If receiver requests deletion → sets `deletedByReceiver = true`
 * - If both flags are true → permanently removes the document
 *
 * Emits `message:deleted` to both users via Socket.io.
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.userId;

    if (!mongoose.isValidObjectId(messageId)) {
      return error(res, "Invalid message ID.", 400);
    }

    const msg = await Message.findById(messageId);
    if (!msg) {
      return error(res, "Message not found.", 404);
    }

    const isSender = msg.sender.toString() === currentUserId;
    const isReceiver = msg.receiver.toString() === currentUserId;
    const otherUserId = isSender ? msg.receiver.toString() : msg.sender.toString();

    if (!isSender && !isReceiver) {
      return error(res, "Access denied. You are not part of this conversation.", 403);
    }

    // New Requirement: If sender deletes, delete for everyone. If receiver deletes, delete for me.
    if (isSender) {
        // Hard delete for both
        await Message.findByIdAndDelete(messageId);
    } else {
        // Soft delete for receiver only
        msg.deletedByReceiver = true;
        if (msg.deletedBySender) {
            await Message.findByIdAndDelete(messageId);
        } else {
            await msg.save();
        }
    }

    // Emit real-time deletion event to both parties
    const io = req.app.get("io");
    if (io) {
      emitToUser(io, currentUserId, "message:deleted", { messageId });
      emitToUser(io, otherUserId, "message:deleted", { messageId });
    }

    return success(res, null, isSender ? "Message deleted for everyone." : "Message deleted for you.");
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   7. POST /api/messages/:messageId/open
   ══════════════════════════════════════════ */

/**
 * Decrypt an archival message record using the receiver's private key.
 * 
 * INPUT: { messageId, receiverPrivateKey }
 * 
 * This follows the "Server-Side RAM Helper" pattern.
 */
const openMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { receiverPrivateKey } = req.body;

    if (!receiverPrivateKey || typeof receiverPrivateKey !== "string") {
      return error(res, "Your local private key is required to access this archival record.", 400);
    }

    const msg = await Message.findById(messageId).select("ciphertext receiver sender");
    if (!msg) {
      return error(res, "Archival record not found.", 404);
    }

    // Security Check: Only the intended receiver can request decryption
    if (msg.receiver.toString() !== req.user.userId) {
      return error(res, "Cryptographic handshake mismatch. You are not the authorized receiver.", 403);
    }

    // Perform hybrid decryption
    let decoded;
    try {
      decoded = rsaService.decryptMessage(msg.ciphertext, receiverPrivateKey);
    } catch (err) {
      const errMsg = err?.message || "Unknown cryptographic error";
      console.error(`[Message Controller] Decryption Error: ${errMsg}`);
      return error(res, `Cryptographic handshake failed: ${errMsg}`, 400);
    }

    return success(
      res,
      {
        id: msg._id,
        message: decoded.message,
        signature: decoded.signature,
      },
      "Archival payload accessed via secure handshake."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   8. POST /api/messages/conversation/:userId/open
   ══════════════════════════════════════════ */

/**
 * Decrypt a full conversation using the current user's private key.
 * This is a helper endpoint for prototypes to avoid N+1 requests.
 */
const openConversation = async (req, res, next) => {
  try {
    const { userId: otherUserId } = req.params;
    const { privateKey } = req.body;
    const currentUserId = req.user.userId;

    if (!privateKey || typeof privateKey !== "string") {
      return error(res, "Your local private key is required to access this conversation.", 400);
    }
    if (!mongoose.isValidObjectId(otherUserId)) {
      return error(res, "Invalid user ID.", 400);
    }

    const filter = {
      $or: [
        { sender: currentUserId, receiver: otherUserId, deletedBySender: false },
        { sender: otherUserId, receiver: currentUserId, deletedByReceiver: false },
      ],
    };

    // Mark unread messages sent to the current user in this conversation as read
    await Message.updateMany(
      { sender: otherUserId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find(filter)
      .populate("sender", "username publicKey")
      .populate("receiver", "username publicKey")
      .sort({ createdAt: 1 })
      .lean();

    const conversation = messages.map((msg) => {
      let plaintext = null;
      let isDecrypted = false;
      const amIReceiver = msg.receiver._id.toString() === currentUserId;

      if (amIReceiver) {
        try {
           const decoded = rsaService.decryptMessage(msg.ciphertext, privateKey);
           plaintext = decoded.message;
           isDecrypted = true;
        } catch (err) {
           plaintext = "*** DECRYPTION FAILED ***";
        }
      } else if (msg.senderCiphertext) {
        try {
           const decoded = rsaService.decryptMessage(msg.senderCiphertext, privateKey);
           plaintext = decoded.message;
           isDecrypted = true;
        } catch (err) {
           plaintext = "*** DECRYPTION FAILED (Sender Copy) ***";
        }
      } else {
         // I am the sender. Older messages didn't have a sender copy!
         plaintext = "*** ENCRYPTED (Sent payload) ***";
      }

      return {
        id: msg._id,
        sender: { id: msg.sender._id, username: msg.sender.username },
        receiver: { id: msg.receiver._id, username: msg.receiver.username },
        message: plaintext,
        isDecrypted,
        ciphertext: msg.ciphertext,
        signature: msg.signature,
        hash: msg.hash,
        isVerified: msg.isVerified,
        direction: amIReceiver ? "received" : "sent",
        createdAt: msg.createdAt,
      };
    });

    return success(res, { count: conversation.length, conversation }, "Conversation decrypted successfully.");
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   X. GET /api/messages/active-conversations
   ══════════════════════════════════════════ */
const getActiveConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;

    // We want active senders who have sent a message to the logged-in user
    const stats = await Message.aggregate([
      { 
        $match: { 
          receiver: new mongoose.Types.ObjectId(currentUserId), 
          deletedByReceiver: false 
        } 
      },
      { 
        $group: { 
          _id: "$sender", 
          unreadCount: { $sum: { $cond: [ { $eq: ["$isRead", false] }, 1, 0 ] } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "senderDetails"
        }
      },
      { $unwind: "$senderDetails" }
    ]);

    const interactions = stats.map(st => ({
      senderId: st._id.toString(),
      unread: st.unreadCount,
      user: {
        id: st._id.toString(),
        username: st.senderDetails.username,
        publicKey: st.senderDetails.publicKey,
        isOnline: st.senderDetails.isOnline
      }
    }));

    return success(res, { interactions }, "Active conversations fetched.");
  } catch (err) {
    next(err);
  }
};

const generateHash = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return error(res, "Message is required", 400);
    const hash = rsaService.hashMessage(message);
    return success(res, { hash }, "Hash generated using SHA-256");
  } catch (err) { next(err); }
};

const signHash = async (req, res, next) => {
  try {
    const { message, privateKey } = req.body;
    if (!message || !privateKey) return error(res, "Message and Private Key are required", 400);
    const { signature } = rsaService.signMessage(message, privateKey);
    return success(res, { signature }, "Signed using RSA-PSS SHA-256");
  } catch (err) { next(err); }
};

const encryptPayload = async (req, res, next) => {
  try {
    const { message, signature, publicKey } = req.body;
    if (!message || !signature || !publicKey) return error(res, "Params missing", 400);
    const payload = JSON.stringify({ message, signature });
    const ciphertext = rsaService.encryptMessage(payload, publicKey);
    return success(res, { ciphertext }, "Encrypted using AES-256-GCM + RSA-OAEP");
  } catch (err) { next(err); }
};

const decryptPayload = async (req, res, next) => {
  try {
    const { ciphertext, privateKey } = req.body;
    if (!ciphertext || !privateKey) return error(res, "Ciphertext and Private Key are required", 400);
    const { message, signature } = rsaService.decryptMessage(ciphertext, privateKey);
    return success(res, { message, signature }, "Decrypted using AES-256-GCM + RSA-OAEP");
  } catch (err) { next(err); }
};

const verifySignatureFlow = async (req, res, next) => {
  try {
    const { message, signature, publicKey } = req.body;
    if (!message || !signature || !publicKey) return error(res, "Message, Signature, and Public Key are required", 400);
    const result = rsaService.verifySignature(message, signature, publicKey);
    return success(res, result, result.valid ? "Signature Verified!" : "Signature Invalid!");
  } catch (err) { next(err); }
};

module.exports = { 
  sendMessage, 
  getInbox, 
  getSent, 
  getConversation, 
  markVerified, 
  deleteMessage,
  openMessage,
  openConversation,
  getActiveConversations,
  generateHash,
  signHash,
  encryptPayload,
  decryptPayload,
  verifySignatureFlow
};
