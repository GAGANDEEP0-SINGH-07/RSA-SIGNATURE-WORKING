const express = require("express");
const router = express.Router();

const {
  listContacts,
  addContact,
  removeContact,
} = require("../controllers/contact.controller");
const { protect } = require("../middleware/auth.middleware");

// All contact routes require authentication
router.use(protect);

// GET    /api/contacts/list            → List all added contacts
router.get("/list", listContacts);

// POST   /api/contacts/add/:userId     → Add a user to contacts
router.post("/add/:userId", addContact);

// DELETE /api/contacts/remove/:userId  → Remove a user from contacts
router.delete("/remove/:userId", removeContact);

module.exports = router;
