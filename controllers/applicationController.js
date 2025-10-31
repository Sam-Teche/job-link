const applicationService = require("../services/applicationService");
const cloudinary = require("cloudinary").v2;

class ApplicationController {
  async submitApplication(req, res) {
    try {
      console.log("📥 Received application");
      console.log("Body:", req.body);
      console.log("Files:", req.files);

      const application = await applicationService.createApplication(
        req.body,
        req.files
      );

      res.status(201).json({
        message:
          "Application submitted successfully! Check your email for confirmation.",
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        application: {
          name: `${application.firstName} ${application.lastName}`,
          position: application.position,
          email: application.email,
          submittedAt: application.submittedAt,
        },
      });
    } catch (error) {
      console.error("❌ Application submission error:", error);

      // Clean up uploaded Cloudinary files on error
      if (req.files) {
        try {
          const deletePromises = [];

          Object.values(req.files).forEach((fileArray) => {
            fileArray.forEach((file) => {
              // Extract public_id from Cloudinary response
              if (file.filename) {
                // file.filename contains the public_id in Cloudinary
                deletePromises.push(cloudinary.uploader.destroy(file.filename));
              }
            });
          });

          await Promise.all(deletePromises);
          console.log("🗑️ Cleaned up uploaded files");
        } catch (cleanupError) {
          console.error("⚠️ File cleanup error:", cleanupError);
        }
      }

      res.status(400).json({
        message: error.message || "Failed to submit application",
      });
    }
  }

  async getApplications(req, res) {
    try {
      const result = await applicationService.getAllApplications(req.query);
      res.json(result);
    } catch (error) {
      console.error("❌ Get applications error:", error);
      res.status(500).json({
        message: "Failed to fetch applications",
        error: error.message,
      });
    }
  }

  async getApplicationById(req, res) {
    try {
      const application = await applicationService.getApplicationById(
        req.params.id
      );
      res.json({ application });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status, notes } = req.body;
      const application = await applicationService.updateApplicationStatus(
        req.params.id,
        status,
        notes
      );

      res.json({
        message: "Application status updated successfully",
        application,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteApplication(req, res) {
    try {
      const result = await applicationService.deleteApplication(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  async getStatistics(req, res) {
    try {
      const stats = await applicationService.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch statistics",
        error: error.message,
      });
    }
  }
}

module.exports = new ApplicationController();
