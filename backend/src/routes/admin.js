import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const router = express.Router();

// Basic analytics summary
router.get("/summary", protect, adminOnly, async (req, res) => {
  try {
    const [userCount, conversationCount, messageCount] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments(),
    ]);

    res.json({
      userCount,
      conversationCount,
      messageCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// List users for admin management
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select("name email role isActive createdAt");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user role / active status
router.patch("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role && ["user", "admin"].includes(role)) {
      user.role = role;
    }
    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// List conversations with basic info
router.get("/conversations", protect, adminOnly, async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    // Attach message counts
    const withCounts = await Promise.all(
      conversations.map(async (conv) => {
        const count = await Message.countDocuments({
          conversation: conv._id,
        });
        return {
          id: conv._id,
          user: conv.user,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messageCount: count,
        };
      })
    );

    res.json(withCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get full conversation with messages
router.get("/conversations/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id).populate(
      "user",
      "name email"
    );
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ conversation, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Messages per day (simple)
router.get("/messages-per-day", protect, adminOnly, async (req, res) => {
  try {
    const data = await Message.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      data.map((d) => ({
        date: d._id,
        count: d.count,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Top intents
router.get("/top-intents", protect, adminOnly, async (req, res) => {
  try {
    const data = await Message.aggregate([
      { $match: { sender: "bot", intent: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$intent",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json(
      data.map((d) => ({
        intent: d._id,
        count: d.count,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

