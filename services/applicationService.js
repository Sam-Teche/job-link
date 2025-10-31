const Application = require("../models/Application");
const EmailService = require("./emailService");
const cloudinary = require("cloudinary").v2;

class ApplicationService {
  async createApplication(data, files) {
    // Validate required files
    if (!files || !files.profilePhoto || !files.resume) {
      throw new Error("Profile photo and resume are required");
    }

    // Prepare file paths (Cloudinary returns URLs in file.path)
    const filePaths = {
      profilePhoto: files.profilePhoto[0].path,
      resume: files.resume[0].path,
      driverLicense: files.driverLicense ? files.driverLicense[0].path : null,
      additionalDocs: files.additionalDocs
        ? files.additionalDocs.map((f) => f.path)
        : [],
    };

    // Store Cloudinary public_ids for later deletion
    const fileIds = {
      profilePhotoId: files.profilePhoto[0].filename,
      resumeId: files.resume[0].filename,
      driverLicenseId: files.driverLicense
        ? files.driverLicense[0].filename
        : null,
      additionalDocsIds: files.additionalDocs
        ? files.additionalDocs.map((f) => f.filename)
        : [],
    };

    // Create application
    const application = new Application({
      ...data,
      ...filePaths,
      ...fileIds, // Store public_ids for deletion
      backgroundCheck: data.backgroundCheck === "on",
      termsAccepted: data.termsAccepted === "on",
    });

    await application.save();

    // Send confirmation email
    try {
      await EmailService.sendApplicationConfirmation(application);
    } catch (err) {
      console.error("⚠️ Email failed but application saved:", err.message);
    }

    return application;
  }

  async getAllApplications(filters = {}, pagination = {}) {
    const {
      status,
      position,
      page = 1,
      limit = 10,
    } = { ...filters, ...pagination };

    const filter = {};
    if (status) filter.status = status;
    if (position) filter.position = new RegExp(position, "i");

    const applications = await Application.find(filter)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-__v");

    const count = await Application.countDocuments(filter);

    return {
      applications,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
    };
  }

  async getApplicationById(id) {
    const application = await Application.findById(id);
    if (!application) {
      throw new Error("Application not found");
    }
    return application;
  }

  async updateApplicationStatus(id, status, notes) {
    const validStatuses = [
      "pending",
      "reviewing",
      "interview",
      "accepted",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    const application = await Application.findByIdAndUpdate(
      id,
      { status, notes, updatedAt: Date.now() },
      { new: true }
    );

    if (!application) {
      throw new Error("Application not found");
    }

    // Send status update email
    try {
      await EmailService.sendStatusUpdateEmail(application, status);
    } catch (err) {
      console.error("⚠️ Email failed:", err.message);
    }

    return application;
  }

  async deleteApplication(id) {
    const application = await Application.findById(id);
    if (!application) {
      throw new Error("Application not found");
    }

    // Delete files from Cloudinary
    await this.deleteCloudinaryFiles(application);

    await application.deleteOne();
    return { message: "Application deleted successfully" };
  }

  async deleteCloudinaryFiles(application) {
    const deletePromises = [];

    // Delete profile photo
    if (application.profilePhotoId) {
      deletePromises.push(
        cloudinary.uploader
          .destroy(application.profilePhotoId)
          .catch((err) =>
            console.error(`Failed to delete profile photo: ${err.message}`)
          )
      );
    }

    // Delete resume
    if (application.resumeId) {
      deletePromises.push(
        cloudinary.uploader
          .destroy(application.resumeId)
          .catch((err) =>
            console.error(`Failed to delete resume: ${err.message}`)
          )
      );
    }

    // Delete driver license
    if (application.driverLicenseId) {
      deletePromises.push(
        cloudinary.uploader
          .destroy(application.driverLicenseId)
          .catch((err) =>
            console.error(`Failed to delete license: ${err.message}`)
          )
      );
    }

    // Delete additional docs
    if (
      application.additionalDocsIds &&
      application.additionalDocsIds.length > 0
    ) {
      application.additionalDocsIds.forEach((id) => {
        deletePromises.push(
          cloudinary.uploader
            .destroy(id)
            .catch((err) =>
              console.error(`Failed to delete additional doc: ${err.message}`)
            )
        );
      });
    }

    await Promise.allSettled(deletePromises);
    console.log("🗑️ Cloudinary files deleted");
  }

  async getStatistics() {
    const totalApplications = await Application.countDocuments();
    const statusCounts = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const positionStats = await Application.aggregate([
      { $group: { _id: "$position", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const stats = {
      total: totalApplications,
      pending: 0,
      reviewing: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
    };

    statusCounts.forEach((item) => {
      stats[item._id] = item.count;
    });

    return {
      ...stats,
      topPositions: positionStats,
    };
  }
}

module.exports = new ApplicationService();
