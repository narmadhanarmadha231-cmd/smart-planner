// api/index.js — Vercel Serverless Function (fully self-contained)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json());

// ── MongoDB cached connection ─────────────────────────────────────────────────
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set");

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Models ────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const TaskSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:          { type: String, required: true },
  subject:        { type: String, required: true },
  deadline:       { type: String, required: true },
  priority:       { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  estimatedHours: { type: Number, default: 2 },
  completed:      { type: Boolean, default: false },
  completedAt:    { type: Date, default: null },
  createdAt:      { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

// ── User Routes ───────────────────────────────────────────────────────────────
const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Please fill all fields" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({
      message: "Registration successful",
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Please enter email and password" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      message: "Login successful",
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Task Routes ───────────────────────────────────────────────────────────────
const taskRouter = express.Router();

taskRouter.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId)
      return res.status(400).json({ error: "User ID header (x-user-id) is required" });

    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

taskRouter.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId)
      return res.status(400).json({ error: "User ID header (x-user-id) is required" });

    const { title, subject, deadline, priority, estimatedHours } = req.body;
    if (!title || !subject || !deadline)
      return res.status(400).json({ error: "Title, subject, and deadline are required" });

    const task = new Task({
      userId, title, subject, deadline,
      priority: priority || "Medium",
      estimatedHours: estimatedHours !== undefined ? Number(estimatedHours) : 2,
      completed: false,
      completedAt: null,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

taskRouter.put("/:id", async (req, res) => {
  try {
    const { completed } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ error: "Task not found" });

    task.completed = completed !== undefined ? completed : !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

taskRouter.put("/:id/edit", async (req, res) => {
  try {
    const { title, subject, deadline, priority, estimatedHours } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ error: "Task not found" });

    if (title !== undefined)          task.title = title;
    if (subject !== undefined)        task.subject = subject;
    if (deadline !== undefined)       task.deadline = deadline;
    if (priority !== undefined)       task.priority = priority;
    if (estimatedHours !== undefined) task.estimatedHours = Number(estimatedHours);

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

taskRouter.delete("/:id", async (req, res) => {
  try {
    const result = await Task.findByIdAndDelete(req.params.id);
    if (!result)
      return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Mount & Export ────────────────────────────────────────────────────────────
app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", dbState: mongoose.connection.readyState })
);

module.exports = app;
