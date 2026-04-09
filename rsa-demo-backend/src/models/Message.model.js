const mongoose = require("mongoose");

/**
 * @typedef {Object} MessageDocument
 * @property {ObjectId} sender     – The user who composed and encrypted the message.
 * @property {ObjectId} receiver   – The intended recipient who can decrypt the message.
 * @property {string}   ciphertext – Base-64 encoded RSA-OAEP encrypted payload.
 * @property {string}   signature  – Base-64 encoded RSA-PSS digital signature.
 * @property {string}   hash       – SHA-256 hex digest of the original plaintext.
 * @property {boolean}  isVerified – Whether the signature has been verified by the receiver.
 * @property {Date}     createdAt  – Auto-managed by Mongoose timestamps.
 */

const messageSchema = new mongoose.Schema(
  {
    /**
     * Reference to the User who sent the message.
     * Populated at query time to retrieve sender details (username, publicKey).
     */
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required."],
      index: true,
    },

    /**
     * Reference to the User who is the intended recipient.
     * Only this user possesses the private key needed to decrypt `ciphertext`.
     */
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver is required."],
      index: true,
    },

    /**
     * The message content encrypted with the receiver's RSA public key
     * using OAEP padding (SHA-256).
     * Stored as a Base-64 encoded string.
     */
    ciphertext: {
      type: String,
      required: [true, "Encrypted message content (ciphertext) is required."],
    },

    /**
     * The message content encrypted with the SENDER'S RSA public key.
     * This allows the sender to decrypt their own history while maintaining
     * zero-knowledge security on the server.
     */
    senderCiphertext: {
      type: String,
    },

    /**
     * Digital signature created by the sender using their RSA private key
     * with PSS padding (SHA-256).
     * Allows the receiver to verify that the message was truly sent by
     * the claimed sender and was not tampered with in transit.
     * Stored as a Base-64 encoded string.
     */
    signature: {
      type: String,
      required: [true, "Digital signature is required."],
    },

    /**
     * SHA-256 hex digest of the original plaintext message.
     * Acts as a message integrity fingerprint — the receiver can hash
     * the decrypted plaintext and compare it to this value for an
     * additional layer of integrity verification.
     */
    hash: {
      type: String,
      required: [true, "Message hash is required."],
    },

    /**
     * Indicates whether the receiver has successfully verified
     * the digital signature against the sender's public key.
     * Defaults to `false` until explicit verification is performed.
     */
    isVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * Indicates whether the receiver has read the message.
     */
    isRead: {
      type: Boolean,
      default: false,
    },

    /**
     * Soft-delete flag set when the sender deletes this message
     * from their "sent" view.
     */
    deletedBySender: {
      type: Boolean,
      default: false,
    },

    /**
     * Soft-delete flag set when the receiver deletes this message
     * from their inbox view.
     */
    deletedByReceiver: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/* ────────────────────────────────────────────
   Compound indexes for efficient queries
   ──────────────────────────────────────────── */

/**
 * Optimises conversation look-ups between two specific users.
 *   db.messages.find({ sender: X, receiver: Y })
 */
messageSchema.index({ sender: 1, receiver: 1 });

/**
 * Optimises "inbox" queries — fetch all messages for a receiver,
 * sorted newest-first.
 *   db.messages.find({ receiver: Y }).sort({ createdAt: -1 })
 */
messageSchema.index({ receiver: 1, createdAt: -1 });

/**
 * Optimises "sent" queries — fetch all messages from a sender,
 * sorted newest-first.
 *   db.messages.find({ sender: X }).sort({ createdAt: -1 })
 */
messageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
