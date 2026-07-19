require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const taskRoutes = require("./routes/tasks");
const userRoutes = require("./routes/users");

const app = express();
const port = process.env.PORT || 5000;

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

// Allow requests from Vercel frontend and localhost dev
const allowedOrigins = [
  /^https:\/\/.*\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((pattern) => pattern.test(origin));
      if (allowed) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check for Render uptime
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

// Check MongoDB URL
if (!mongoUri) {
  console.error("❌ Missing MongoDB connection string. Add MONGODB_URI in .env");
  process.exit(1);
}

// MongoDB Connection
mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((error) => {
    console.error("❌ MongoDB Error:", error.message);
  });

const path = require("path");

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../client/dist")));

// Wildcard route to handle React Router client-side navigation
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});