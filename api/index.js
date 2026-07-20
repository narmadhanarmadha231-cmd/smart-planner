// api/index.js  — Vercel Serverless Function
// Wraps the full Express app so it runs as a serverless function on Vercel.
// Optimized for fast serverless database connection times.

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  })
);
app.use(express.json());

// ── MongoDB Caching (Official Vercel Serverless Pattern) ─────────────────────
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Fail quickly if firewalled instead of hanging
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Clear cached promise on failure to retry next time
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
    res.status(500).json({ message: "Database connection failed" });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
const taskRoutes = require("../server/routes/tasks");
const userRoutes = require("../server/routes/users");

app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// ── Export for Vercel ─────────────────────────────────────────────────────────
module.exports = app;
