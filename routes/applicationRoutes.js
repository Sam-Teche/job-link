const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const upload = require("../middleware/uploadMiddleware");

// Public routes
router.post(
  "/apply",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "driverLicense", maxCount: 1 },
    { name: "additionalDocs", maxCount: 5 },
  ]),
  applicationController.submitApplication
);

// Admin routes (add authentication middleware in production)
router.get("/applications", applicationController.getApplications);
router.get("/applications/:id", applicationController.getApplicationById);
router.patch("/applications/:id/status", applicationController.updateStatus);
router.delete("/applications/:id", applicationController.deleteApplication);
router.get("/stats", applicationController.getStatistics);

module.exports = router;
