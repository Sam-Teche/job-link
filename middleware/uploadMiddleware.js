const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// 🔧 Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ☁️ Configure Cloudinary storage (instead of local disk)
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Determine upload folder based on fieldname
    let folder = "joblink_uploads/documents";
    if (file.fieldname === "profilePhoto") folder = "joblink_uploads/photos";
    else if (file.fieldname === "resume") folder = "joblink_uploads/resumes";
    else if (file.fieldname === "driverLicense")
      folder = "joblink_uploads/licenses";

    // Only allow specific file types
    const allowedFormats = ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"];

    return {
      folder,
      allowed_formats: allowedFormats,
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

// ✅ Optional: filter out invalid uploads before Cloudinary receives them
const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif/;
  const docTypes = /pdf|doc|docx/;
  const ext = file.originalname.split(".").pop().toLowerCase();

  if (file.fieldname === "profilePhoto" || file.fieldname === "driverLicense") {
    if (imageTypes.test(ext)) cb(null, true);
    else cb(new Error("Only image files allowed for photos/licenses!"));
  } else if (file.fieldname === "resume") {
    if (docTypes.test(ext)) cb(null, true);
    else cb(new Error("Only PDF/DOC/DOCX allowed for resumes!"));
  } else {
    cb(null, true);
  }
};

// ⚙️ Initialize Multer with Cloudinary storage
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

module.exports = upload;
