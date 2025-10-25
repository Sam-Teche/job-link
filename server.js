const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose")
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// Import modules (uncomment when files are created)
const connectDB = require('./config/database');
const applicationRoutes = require('./routes/applicationRoutes');

//Routes
app.use('/api/employment', applicationRoutes);

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
  console.log(`   GET    /api/employment/applications - Get all applications`);
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
