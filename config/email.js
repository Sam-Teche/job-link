const nodemailer = require("nodemailer");

const emailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
};

const transporter = nodemailer.createTransport(emailConfig);

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email configuration error:", error);
  } else {
    console.log("✅ Email server ready");
  }
});

module.exports = transporter;
