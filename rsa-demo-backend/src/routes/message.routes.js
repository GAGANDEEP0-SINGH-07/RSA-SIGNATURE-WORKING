const express = require("express");
const router = express.Router();
const largeBodyParser = express.json({ limit: "50kb" });

const {
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
} = require("../controllers/message.controller");
const { protect } = require("../middleware/auth.middleware");
const {
  validate,
  sendMessageSchema,
} = require("../middleware/validate.middleware");

// All message routes require authentication
router.use(protect);

// ── Flow Step Visualization Routes ──
router.post("/flow/hash", largeBodyParser, generateHash);
router.post("/flow/sign", largeBodyParser, signHash);
router.post("/flow/encrypt", largeBodyParser, encryptPayload);
router.post("/flow/decrypt", largeBodyParser, decryptPayload);
router.post("/flow/verify", largeBodyParser, verifySignatureFlow);

// GET    /api/messages/active-conversations    → Fetch distinct senders and unread count
router.get("/active-conversations", getActiveConversations);

// POST   /api/messages/send                    → Send an encrypted, signed message
router.post("/send", largeBodyParser, validate(sendMessageSchema), sendMessage);

// GET    /api/messages/inbox                   → Fetch all received messages (encrypted)
router.get("/inbox", getInbox);

// GET    /api/messages/sent                    → Fetch all sent messages
router.get("/sent", getSent);

// GET    /api/messages/conversation/:userId    → Fetch conversation with a specific user
router.get("/conversation/:userId", getConversation);

// PATCH  /api/messages/:messageId/verify       → Mark message as verified
router.patch("/:messageId/verify", markVerified);

// DELETE /api/messages/:messageId              → Soft-delete a message
router.delete("/:messageId", deleteMessage);

// POST   /api/messages/:messageId/open         → Decrypt a message using recipient private key
router.post("/:messageId/open", openMessage);

// POST   /api/messages/conversation/:userId/open → Decrypt an entire conversation
router.post("/conversation/:userId/open", openConversation);

module.exports = router;
