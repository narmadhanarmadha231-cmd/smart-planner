const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// Get all tasks for the user
router.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(400).json({ error: "User ID header (x-user-id) is required" });
    }

    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new task for the user
router.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(400).json({ error: "User ID header (x-user-id) is required" });
    }

    const { title, subject, deadline, priority, estimatedHours } = req.body;
    if (!title || !subject || !deadline) {
      return res.status(400).json({ error: "Title, subject, and deadline are required" });
    }

    const task = new Task({
      userId,
      title,
      subject,
      deadline,
      priority: priority || "Medium",
      estimatedHours: estimatedHours !== undefined ? Number(estimatedHours) : 2,
      completed: false,
      completedAt: null,
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle completion status of a task
router.put("/:id", async (req, res) => {
  try {
    const { completed } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.completed = completed !== undefined ? completed : !task.completed;
    task.completedAt = task.completed ? new Date() : null;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit details of an existing task
router.put("/:id/edit", async (req, res) => {
  try {
    const { title, subject, deadline, priority, estimatedHours } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (title !== undefined) task.title = title;
    if (subject !== undefined) task.subject = subject;
    if (deadline !== undefined) task.deadline = deadline;
    if (priority !== undefined) task.priority = priority;
    if (estimatedHours !== undefined) task.estimatedHours = Number(estimatedHours);

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const result = await Task.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
