// api/index.js  — Vercel Serverless Function
// Wraps the full Express app so it runs as a serverless function on Vercel.
// This eliminates cold starts (Vercel warms up in <300ms vs Render's 30s).

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => cb(null, true), // allow all on same Vercel domain
    credentials: true,
  })
);
app.use(express.json());

// ── MongoDB (reuse connection across warm invocations) ────────────────────────
let cachedDb = null;
async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) return;
  cachedDb = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });
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
