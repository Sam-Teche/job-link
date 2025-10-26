const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Verify configuration
if (!process.env.RESEND_API_KEY) {
  console.log("⚠️ RESEND_API_KEY not configured");
} else {
  console.log("✅ Resend email service ready");
}

module.exports = resend;
