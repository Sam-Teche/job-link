const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://localhost:5501",
      "http://localhost:5502",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5501",
      "http://127.0.0.1:5502",
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Import modules
const connectDB = require("./config/database");
const applicationRoutes = require("./routes/applicationRoutes");

// Routes
app.use("/api/employment", applicationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`\n📝 API Endpoints:`);
    console.log(`   POST   /api/employment/apply - Submit application`);
    console.log(
      `   GET    /api/employment/applications - Get all applications`
    );
    console.log(
      `   GET    /api/employment/applications/:id - Get single application`
    );
    console.log(
      `   PATCH  /api/employment/applications/:id/status - Update status`
    );
    console.log(
      `   DELETE /api/employment/applications/:id - Delete application`
    );
    console.log(`   GET    /api/employment/stats - Get statistics\n`);
  });
});

module.exports = app;
