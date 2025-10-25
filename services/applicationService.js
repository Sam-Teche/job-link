const Application = require("../models/Application");
const EmailService = require("./emailService");
const FileHandler = require("../utils/fileHandler");

class ApplicationService {
  async createApplication(data, files) {
    // Validate required files
    if (!files || !files.profilePhoto || !files.resume) {
      throw new Error("Profile photo and resume are required");
    }

    // Prepare file paths
    const filePaths = {
      profilePhoto: files.profilePhoto[0].path,
      resume: files.resume[0].path,
      driverLicense: files.driverLicense ? files.driverLicense[0].path : null,
      additionalDocs: files.additionalDocs
        ? files.additionalDocs.map((f) => f.path)
        : [],
    };

    // Create application
    const application = new Application({
      ...data,
      ...filePaths,
      backgroundCheck: data.backgroundCheck === "on",
      termsAccepted: data.termsAccepted === "on",
    });

    await application.save();

    // Send confirmation email
    await EmailService.sendApplicationConfirmation(application);

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
    await EmailService.sendStatusUpdateEmail(application, status);

    return application;
  }

  async deleteApplication(id) {
    const application = await Application.findById(id);
    if (!application) {
      throw new Error("Application not found");
    }

    // Delete associated files
    FileHandler.deleteApplicationFiles(application);

    await application.deleteOne();
    return { message: "Application deleted successfully" };
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
