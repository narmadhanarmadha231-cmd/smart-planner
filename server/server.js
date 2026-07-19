require("dotenv").config();


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const taskRoutes = require("./routes/tasks");
const userRoutes = require("./routes/users");

const app = express();
const port = process.env.PORT || 5000;

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());

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