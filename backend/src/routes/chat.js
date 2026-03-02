import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";
import { getBotResponse } from "../ml/chatbot.js";

const router = express.Router();

// Get all conversations for logged-in user
router.get("/conversations", protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id })
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new conversation
router.post("/conversations", protect, async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await Conversation.create({
      user: req.user._id,
      title: title || "New conversation",
    });
    res.status(201).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages in a conversation
router.get("/conversations/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({
      _id: id,
      user: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: id }).sort({
      createdAt: 1,
    });
    res.json({ conversation, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a message in a conversation and get bot reply
router.post("/conversations/:id/message", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      user: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const userMessage = await Message.create({
      conversation: id,
      sender: "user",
      text,
    });

    const { intent, response, score } = getBotResponse(text);

    const botMessage = await Message.create({
      conversation: id,
      sender: "bot",
      text: response,
      intent,
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(201).json({
      userMessage,
      botMessage,
      meta: { intent, score },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

