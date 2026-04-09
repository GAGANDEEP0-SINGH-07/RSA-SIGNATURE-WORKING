/**
 * RSA Cryptographic Service
 *
 * Uses ONLY Node.js built-in `crypto` module.
 * All keys are handled in PEM format.
 *
 * Algorithms:
 *   - Hashing    : SHA-256
 *   - Signing    : RSA-SHA256 with PSS padding
 *   - Encryption : Hybrid — AES-256-GCM for data, RSA-OAEP for key wrapping
 *
 * Why hybrid?
 *   Raw RSA-OAEP with a 2048-bit key can only encrypt ~190 bytes.
 *   The JSON payload { message, signature } easily exceeds that.
 *   So we generate a random AES key, encrypt the data with AES-256-GCM,
 *   then RSA-encrypt only the 32-byte AES key.
 */

const crypto = require("crypto");

const RSA_KEY_SIZE = parseInt(process.env.RSA_KEY_SIZE, 10) || 2048;

/* ══════════════════════════════════════════
   1. generateRSAKeyPair()
   ══════════════════════════════════════════ */

/**
 * Generate an RSA key pair.
 *
 * @param {number} [keySize] – Optional override for modulus length.
 * @returns {{ publicKey: string, privateKey: string }} PEM-encoded keys.
 */
const generateRSAKeyPair = (keySize) => {
  const modulusLength = keySize || RSA_KEY_SIZE;
  console.log(`[RSA Service] generateRSAKeyPair → modulusLength: ${modulusLength}`);

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  console.log("[RSA Service] generateRSAKeyPair → key pair generated successfully");
  return { publicKey, privateKey };
};

/* ══════════════════════════════════════════
   2. hashMessage(message)
   ══════════════════════════════════════════ */

/**
 * Compute the SHA-256 hash of a plaintext message.
 *
 * @param {string} message – The plaintext to hash.
 * @returns {string} Hex-encoded SHA-256 digest.
 */
const hashMessage = (message) => {
  console.log(`[RSA Service] hashMessage → input length: ${message.length} chars`);

  const hash = crypto.createHash("sha256").update(message).digest("hex");

  console.log(`[RSA Service] hashMessage → SHA-256: ${hash.substring(0, 16)}...`);
  return hash;
};

/* ══════════════════════════════════════════
   3. signMessage(message, privateKeyPem)
   ══════════════════════════════════════════ */

/**
 * Sign a message using RSA-SHA256 with PSS padding.
 *
 * Steps:
 *   1. Hash the message with SHA-256
 *   2. Sign the hash using the private key
 *
 * @param {string} message       – Plaintext message to sign.
 * @param {string} privateKeyPem – PEM-encoded RSA private key.
 * @returns {{ hash: string, signature: string }}
 *   - hash:      hex-encoded SHA-256 of the message
 *   - signature: base64-encoded digital signature
 */
const signMessage = (message, privateKeyPem) => {
  console.log("[RSA Service] signMessage → hashing message...");
  const hash = hashMessage(message);

  console.log("[RSA Service] signMessage → signing with RSA-SHA256 + PSS...");
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(message);
  signer.end();

  const signature = signer.sign(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    },
    "base64"
  );

  console.log(`[RSA Service] signMessage → signature: ${signature.substring(0, 20)}...`);
  return { hash, signature };
};

/* ══════════════════════════════════════════
   4. verifySignature(message, signatureBase64, publicKeyPem)
   ══════════════════════════════════════════ */

/**
 * Verify an RSA-SHA256 PSS signature against a message.
 *
 * @param {string} message         – Original plaintext message.
 * @param {string} signatureBase64 – Base64-encoded signature to verify.
 * @param {string} publicKeyPem    – PEM-encoded RSA public key of the signer.
 * @returns {{ valid: boolean, hashA: string, hashB: string }}
 *   - valid: whether the signature is cryptographically valid
 *   - hashA: SHA-256 of the received message
 *   - hashB: SHA-256 recomputed for comparison
 */
const verifySignature = (message, signatureBase64, publicKeyPem) => {
  try {
    console.log("[RSA Service] verifySignature → computing hashA...");
    const hashA = hashMessage(message);

    console.log("[RSA Service] verifySignature → verifying with RSA-SHA256 + PSS...");
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(message);
    verifier.end();

    const valid = verifier.verify(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      },
      signatureBase64,
      "base64"
    );

    // hashB = independent recomputation for integrity comparison
    const hashB = hashMessage(message);

    console.log(`[RSA Service] verifySignature → valid: ${valid}`);
    return { valid, hashA, hashB };
  } catch (err) {
    console.log(`[RSA Service] verifySignature → FAILED: ${err.message}`);
    const hash = hashMessage(message);
    return { valid: false, hashA: hash, hashB: hash };
  }
};

/* ══════════════════════════════════════════
   5. encryptMessage(plaintext, publicKeyPem)
      HYBRID: AES-256-GCM data encryption +
              RSA-OAEP key wrapping
   ══════════════════════════════════════════ */

/**
 * Encrypt a payload using hybrid encryption.
 *
 * How it works:
 *   1. Generate a random 256-bit AES key + 96-bit IV
 *   2. Encrypt the plaintext with AES-256-GCM → { ciphertext, authTag }
 *   3. RSA-encrypt the AES key with the receiver's public key (OAEP + SHA-256)
 *   4. Bundle everything into a single base64-encoded JSON envelope
 *
 * @param {string} plaintext    – The string to encrypt (can be any length).
 * @param {string} publicKeyPem – PEM-encoded RSA public key of the receiver.
 * @returns {string} Base64-encoded JSON envelope containing all parts.
 */
const encryptMessage = (plaintext, publicKeyPem) => {
  console.log(`[RSA Service] encryptMessage → plaintext length: ${plaintext.length} chars`);

  // 1. Generate random AES-256 key (32 bytes) and IV (12 bytes for GCM)
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  console.log("[RSA Service] encryptMessage → AES-256 key and IV generated");

  // 2. Encrypt plaintext with AES-256-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  let aesCiphertext = cipher.update(plaintext, "utf-8", "base64");
  aesCiphertext += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");
  console.log("[RSA Service] encryptMessage → AES-GCM encryption done");

  // 3. RSA-encrypt the AES key (only 32 bytes — well within RSA limits)
  const encryptedKey = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey
  ).toString("base64");
  console.log("[RSA Service] encryptMessage → AES key RSA-wrapped");

  // 4. Bundle into a JSON envelope, then base64-encode the whole thing
  const envelope = JSON.stringify({
    encryptedKey,
    iv: iv.toString("base64"),
    ciphertext: aesCiphertext,
    authTag,
  });

  const result = Buffer.from(envelope, "utf-8").toString("base64");
  console.log(`[RSA Service] encryptMessage → final envelope: ${result.length} chars`);
  return result;
};

/* ══════════════════════════════════════════
   6. decryptMessage(ciphertextBase64, privateKeyPem)
      HYBRID: RSA key-unwrap + AES-256-GCM decrypt
   ══════════════════════════════════════════ */

/**
 * Decrypt a hybrid-encrypted payload.
 *
 * Steps:
 *   1. Base64-decode and parse the JSON envelope
 *   2. RSA-decrypt the AES key using the private key
 *   3. AES-256-GCM decrypt the ciphertext
 *   4. Parse the resulting JSON
 *
 * @param {string} ciphertextBase64 – Base64-encoded JSON envelope.
 * @param {string} privateKeyPem    – PEM-encoded RSA private key.
 * @returns {Object} Parsed JSON payload (typically { message, signature }).
 */
const decryptMessage = (ciphertextBase64, privateKeyPem) => {
  console.log(`[RSA Service] decryptMessage → envelope length: ${ciphertextBase64.length} chars`);

  // 1. Decode and parse the envelope
  let envelope;
  try {
    const envelopeJson = Buffer.from(ciphertextBase64, "base64").toString("utf-8");
    envelope = JSON.parse(envelopeJson);
  } catch (err) {
    // ── LEGACY FALLBACK ──
    // If it's not a JSON envelope, it might be a "Pure RSA" ciphertext from an older version.
    console.warn("[RSA Service] decryptMessage → Malformed envelope, attempting legacy RSA-OAEP fallback...");
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKeyPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(ciphertextBase64, "base64")
      );
      // Legacy messages were also JSON strings: { message, signature }
      return JSON.parse(decrypted.toString("utf-8"));
    } catch (legacyErr) {
      console.error("[RSA Service] decryptMessage → Legacy fallback also failed.");
      throw new Error("Malformed encryption envelope and legacy decryption failed. The payload may be corrupted or encrypted with an incompatible key.");
    }
  }

  if (!envelope || !envelope.encryptedKey || !envelope.iv || !envelope.ciphertext || !envelope.authTag) {
    throw new Error("Incomplete encryption envelope. Missing required cryptographic components.");
  }

  console.log("[RSA Service] decryptMessage → envelope parsed and validated");

  // 2. RSA-decrypt the AES key
  let aesKey;
  try {
    aesKey = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(envelope.encryptedKey, "base64")
    );
  } catch (err) {
    // Re-throw with a more descriptive message for the controller to catch
    throw new Error(`RSA Decryption failed: ${err.message}`);
  }
  console.log("[RSA Service] decryptMessage → AES key RSA-unwrapped");

  // 3. AES-256-GCM decrypt
  const iv = Buffer.from(envelope.iv, "base64");
  const authTag = Buffer.from(envelope.authTag, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(envelope.ciphertext, "base64", "utf-8");
  plaintext += decipher.final("utf-8");
  console.log(`[RSA Service] decryptMessage → AES decrypted: ${plaintext.length} chars`);

  // 4. Parse JSON
  try {
    const parsed = JSON.parse(plaintext);
    console.log("[RSA Service] decryptMessage → JSON parsed successfully");
    return parsed;
  } catch (err) {
    throw new Error("Decrypted payload is not valid JSON. Possible data corruption or key mismatch.");
  }
};

module.exports = {
  generateRSAKeyPair,
  hashMessage,
  signMessage,
  verifySignature,
  encryptMessage,
  decryptMessage,
};
