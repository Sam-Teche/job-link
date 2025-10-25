const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads")); // Serve uploaded files

// Create uploads directory if it doesn't exist
const uploadDirs = [
  "uploads/photos",
  "uploads/resumes",
  "uploads/licenses",
  "uploads/documents",
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==========================================
// FILE UPLOAD CONFIGURATION (Multer)
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/documents";

    if (file.fieldname === "profilePhoto") {
      folder = "uploads/photos";
    } else if (file.fieldname === "resume") {
      folder = "uploads/resumes";
    } else if (file.fieldname === "driverLicense") {
      folder = "uploads/licenses";
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif/;
  const allowedDocTypes = /pdf|doc|docx/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (file.fieldname === "profilePhoto" || file.fieldname === "driverLicense") {
    // Images only
    if (allowedImageTypes.test(extname) || mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for photos!"));
    }
  } else if (file.fieldname === "resume") {
    // Documents only
    if (
      allowedDocTypes.test(extname.slice(1)) ||
      mimetype === "application/pdf" ||
      mimetype === "application/msword" ||
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed for resume!"));
    }
  } else {
    // All document types and images
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: fileFilter,
});

// ==========================================
// DATABASE MODEL
// ==========================================

const applicationSchema = new mongoose.Schema({
  // Personal Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },

  // Position Information
  position: { type: String, required: true },
  department: { type: String, required: true },
  employmentType: { type: String, required: true },
  expectedSalary: { type: Number, required: true },
  startDate: { type: Date, required: true },

  // Education
  educationLevel: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  institution: { type: String, required: true },
  graduationYear: { type: Number, required: true },

  // Work Experience
  yearsOfExperience: { type: Number, required: true },
  previousEmployer: { type: String },
  previousJobTitle: { type: String },
  skills: { type: String, required: true },

  // Documents (file paths)
  profilePhoto: { type: String, required: true },
  resume: { type: String, required: true },
  driverLicense: { type: String },
  additionalDocs: [{ type: String }],

  // Additional Information
  referralSource: { type: String },
  coverLetter: { type: String, required: true },
  workAuthorization: { type: String, required: true },
  backgroundCheck: { type: Boolean, required: true },
  termsAccepted: { type: Boolean, required: true },

  // Metadata
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "reviewing", "accepted", "rejected"],
  },
  submittedAt: { type: Date, default: Date.now },
  notes: { type: String },
});

const Application = mongoose.model("Application", applicationSchema);

// ==========================================
// ROUTES
// ==========================================

// Submit employment application
app.post(
  "/api/employment/apply",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "driverLicense", maxCount: 1 },
    { name: "additionalDocs", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      // Validate required files
      if (!req.files || !req.files.profilePhoto || !req.files.resume) {
        return res.status(400).json({
          message: "Profile photo and resume are required",
        });
      }

      // Prepare file paths
      const filePaths = {
        profilePhoto: req.files.profilePhoto[0].path,
        resume: req.files.resume[0].path,
        driverLicense: req.files.driverLicense
          ? req.files.driverLicense[0].path
          : null,
        additionalDocs: req.files.additionalDocs
          ? req.files.additionalDocs.map((f) => f.path)
          : [],
      };

      // Create application
      const application = new Application({
        ...req.body,
        ...filePaths,
        backgroundCheck: req.body.backgroundCheck === "on",
        termsAccepted: req.body.termsAccepted === "on",
      });

      await application.save();

      res.status(201).json({
        message: "Application submitted successfully",
        applicationId: application._id,
        application: {
          name: `${application.firstName} ${application.lastName}`,
          position: application.position,
          email: application.email,
          submittedAt: application.submittedAt,
        },
      });
    } catch (error) {
      console.error("Error submitting application:", error);

      // Clean up uploaded files if database save fails
      if (req.files) {
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting file:", err);
            });
          });
        });
      }

      res.status(500).json({
        message: "Failed to submit application",
        error: error.message,
      });
    }
  }
);

// Get all applications (Admin route - add authentication in production)
app.get("/api/employment/applications", async (req, res) => {
  try {
    const { status, position, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (position) filter.position = new RegExp(position, "i");

    const applications = await Application.find(filter)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-__v");

    const count = await Application.countDocuments(filter);

    res.json({
      applications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
});

// Get single application by ID
app.get("/api/employment/applications/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ application });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch application",
      error: error.message,
    });
  }
});

// Update application status (Admin route)
app.patch("/api/employment/applications/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!["pending", "reviewing", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status, notes, updatedAt: Date.now() },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({
      message: "Application status updated",
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update application",
      error: error.message,
    });
  }
});

// Delete application (Admin route)
app.delete("/api/employment/applications/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Delete associated files
    const filesToDelete = [
      application.profilePhoto,
      application.resume,
      application.driverLicense,
      ...application.additionalDocs,
    ].filter(Boolean);

    filesToDelete.forEach((filePath) => {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    });

    await application.deleteOne();

    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete application",
      error: error.message,
    });
  }
});

// Get application statistics (Admin dashboard)
app.get("/api/employment/stats", async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({
      status: "pending",
    });
    const reviewingApplications = await Application.countDocuments({
      status: "reviewing",
    });
    const acceptedApplications = await Application.countDocuments({
      status: "accepted",
    });
    const rejectedApplications = await Application.countDocuments({
      status: "rejected",
    });

    // Most applied positions
    const positionStats = await Application.aggregate([
      { $group: { _id: "$position", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      total: totalApplications,
      pending: pendingApplications,
      reviewing: reviewingApplications,
      accepted: acceptedApplications,
      rejected: rejectedApplications,
      topPositions: positionStats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

// ==========================================
// DATABASE CONNECTION & SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/job_link";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Employment API running on port ${PORT}`);
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
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
  });
