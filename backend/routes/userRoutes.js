import express from "express";
import User from "./models/User.js";

const router = express.Router();

// Create user (POST)
router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users (GET)
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Update user (PUT)
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (DELETE)
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
const PORT = process.env.PORT || 5001;