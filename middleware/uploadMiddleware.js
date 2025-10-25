const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directories
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

// Storage configuration
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

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif/;
  const allowedDocTypes = /pdf|doc|docx/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (file.fieldname === "profilePhoto" || file.fieldname === "driverLicense") {
    if (allowedImageTypes.test(extname) || mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  } else if (file.fieldname === "resume") {
    if (
      allowedDocTypes.test(extname.slice(1)) ||
      mimetype === "application/pdf" ||
      mimetype.includes("document")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files allowed for resume!"));
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter,
});

module.exports = upload;
