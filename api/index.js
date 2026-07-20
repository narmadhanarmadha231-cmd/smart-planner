// api/index.js  — Vercel Serverless Function
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json());

// ── MongoDB cached connection (global across warm invocations) ────────────────
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

// ── Routes ────────────────────────────────────────────────────────────────────
const taskRoutes = require("../server/routes/tasks");
const userRoutes = require("../server/routes/users");

app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.get("/health", (req, res) =>
  res.json({ status: "ok", dbState: mongoose.connection.readyState })
);

module.exports = app;
