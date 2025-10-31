const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
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

    // Documents
    profilePhoto: { type: String, required: true },
    resume: { type: String, required: true },
    driverLicense: { type: String },
    additionalDocs: [{ type: String }],

    // Cloudinary public_ids (for file deletion)
    profilePhotoId: { type: String },
    resumeId: { type: String },
    driverLicenseId: { type: String },
    additionalDocsIds: [{ type: String }],

    // Additional Information
    referralSource: { type: String },
    coverLetter: { type: String, required: true },
    workAuthorization: { type: String, required: true },
    backgroundCheck: { type: Boolean, required: true },
    termsAccepted: { type: Boolean, required: true },

    // Metadata
    applicationNumber: { type: String, unique: true },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "reviewing", "interview", "accepted", "rejected"],
    },
    submittedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Generate application number before saving
applicationSchema.pre("save", async function (next) {
  if (!this.applicationNumber) {
    const count = await mongoose.model("Application").countDocuments();
    this.applicationNumber = `APP-${Date.now()}-${String(count + 1).padStart(
      4,
      "0"
    )}`;
  }
  next();
});

module.exports = mongoose.model("Application", applicationSchema);
