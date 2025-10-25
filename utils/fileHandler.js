const fs = require("fs");

class FileHandler {
  static deleteFiles(filePaths) {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];

    paths.filter(Boolean).forEach((filePath) => {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    });
  }

  static deleteApplicationFiles(application) {
    const filesToDelete = [
      application.profilePhoto,
      application.resume,
      application.driverLicense,
      ...application.additionalDocs,
    ];

    this.deleteFiles(filesToDelete);
  }
}

module.exports = FileHandler;
