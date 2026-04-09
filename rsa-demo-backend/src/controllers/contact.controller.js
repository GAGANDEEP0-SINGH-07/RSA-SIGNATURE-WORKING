const mongoose = require("mongoose");
const User = require("../models/User.model");
const { success, error } = require("../utils/response.util");

/* ══════════════════════════════════════════
   1. GET /api/contacts/list
   ══════════════════════════════════════════ */
const listContacts = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate(
      "contacts",
      "username email publicKey bio isOnline lastSeen"
    ).lean();

    if (!user) {
      return error(res, "User not found.", 404);
    }

    const list = user.contacts.map((u) => ({
      id: u._id,
      username: u.username,
      email: u.email,
      publicKey: u.publicKey,
      bio: u.bio || "",
      isOnline: u.isOnline || false,
      lastSeen: u.lastSeen,
    }));

    return success(
      res,
      { count: list.length, users: list },
      "Contacts retrieved successfully."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   2. POST /api/contacts/add/:userId
   ══════════════════════════════════════════ */
const addContact = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    const { userId: contactId } = req.params;

    if (!mongoose.isValidObjectId(contactId)) {
      return error(res, "Invalid contact ID format.", 400);
    }

    if (currentUserId === contactId) {
      return error(res, "You cannot add yourself as a contact.", 400);
    }

    const contactUser = await User.findById(contactId).select("_id");
    if (!contactUser) {
      return error(res, "Contact user not found.", 404);
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return error(res, "User not found.", 404);
    }

    if (user.contacts.includes(contactId)) {
      return error(res, "User is already in your contacts.", 409);
    }

    user.contacts.push(contactId);
    await user.save();

    return success(
      res,
      { contactId },
      "Contact added successfully."
    );
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════
   3. DELETE /api/contacts/remove/:userId
   ══════════════════════════════════════════ */
const removeContact = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    const { userId: contactId } = req.params;

    if (!mongoose.isValidObjectId(contactId)) {
      return error(res, "Invalid contact ID format.", 400);
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return error(res, "User not found.", 404);
    }

    if (!user.contacts.includes(contactId)) {
      return error(res, "User is not in your contacts.", 404);
    }

    user.contacts.pull(contactId);
    await user.save();

    return success(
      res,
      { contactId },
      "Contact removed successfully."
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { listContacts, addContact, removeContact };
