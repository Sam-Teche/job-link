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
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5501",
      "http://127.0.0.1:5502",
      "http://127.0.0.1:5500/frontend",
      "http://127.0.0.1:5500/frontend2",
      "https://joblinkadmin.netlify.app", // Add your production frontend URL
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Important for form data

// Note: No need for static uploads folder with Cloudinary
// Files are stored in cloud, not locally

// Import modules
const connectDB = require("./config/database");
const applicationRoutes = require("./routes/applicationRoutes");

// Routes
app.use("/api/employment", applicationRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Job Link API Server",
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME
      ? "configured"
      : "not configured",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);

  // Handle Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Maximum file size is 10MB.",
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      message: `Upload error: ${err.message}`,
    });
  }

  // Handle Cloudinary errors
  if (err.http_code) {
    return res.status(err.http_code).json({
      message: "File upload error",
      error: err.message,
    });
  }

  // Handle MongoDB errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      message: "Duplicate entry error",
      field: Object.keys(err.keyPattern)[0],
    });
  }

  // Generic error
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

// Start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `☁️  Cloudinary: ${
          process.env.CLOUDINARY_CLOUD_NAME
            ? "✅ Configured"
            : "❌ Not configured"
        }`
      );
      console.log(
        `📦 Database: ${
          mongoose.connection.readyState === 1
            ? "✅ Connected"
            : "❌ Disconnected"
        }`
      );
      console.log(`${"=".repeat(50)}\n`);

      console.log(`📝 API Endpoints:`);
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
      console.log(`   GET    /api/employment/stats - Get statistics`);
      console.log(`   GET    /api/health - Health check\n`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("Database connection closed");
    process.exit(0);
  });
});

module.exports = app;
