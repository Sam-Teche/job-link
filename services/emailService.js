const transporter = require("../config/email");

class EmailService {
  static async sendApplicationConfirmation(application) {
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || "HR Department"}" <${
        process.env.EMAIL_USER
      }>`,
      to: application.email,
      subject: `Application Received - ${application.position}`,
      html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                 color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; 
                                   border-left: 4px solid #667eea; }
                        .info-row { display: flex; justify-content: space-between; padding: 8px 0; 
                                   border-bottom: 1px solid #eee; }
                        .label { font-weight: bold; color: #667eea; }
                        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
                        .button { display: inline-block; padding: 12px 30px; background: #667eea; 
                                 color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Application Received!</h1>
                        </div>
                        <div class="content">
                            <p>Dear <strong>${application.firstName} ${
        application.lastName
      }</strong>,</p>
                            
                            <p>Thank you for submitting your application for the <strong>${
                              application.position
                            }</strong> position. 
                            We have successfully received your application and our recruitment team will review it carefully.</p>
                            
                            <div class="info-box">
                                <h3 style="margin-top: 0; color: #667eea;">Application Details</h3>
                                <div class="info-row">
                                    <span class="label">Application Number:</span>
                                    <span>${
                                      application.applicationNumber
                                    }</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Position:</span>
                                    <span>${application.position}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Department:</span>
                                    <span>${application.department}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Employment Type:</span>
                                    <span>${application.employmentType}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Submitted:</span>
                                    <span>${new Date(
                                      application.submittedAt
                                    ).toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <h3 style="color: #667eea;">What's Next?</h3>
                            <ul>
                                <li>Our HR team will review your application within <strong>3-5 business days</strong></li>
                                <li>If your qualifications match our requirements, we'll contact you for an interview</li>
                                <li>Please keep this email for your records</li>
                                <li>You can reference your application number for any inquiries</li>
                            </ul>
                            
                            <p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                                <strong>⚠️ Important:</strong> If you don't hear from us within 2 weeks, 
                                please feel free to follow up with us.
                            </p>
                            
                            <center>
                                <p>Thank you for your interest in joining our team!</p>
                            </center>
                        </div>
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                            <p>&copy; ${new Date().getFullYear()} ${
        process.env.COMPANY_NAME || "Company Name"
      }. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Confirmation email sent to ${application.email}`);
      return true;
    } catch (error) {
      console.error("❌ Email sending failed:", error);
      return false;
    }
  }

  static async sendStatusUpdateEmail(application, newStatus) {
    const statusMessages = {
      reviewing: {
        subject: "Application Under Review",
        message: "Your application is currently being reviewed by our team.",
        color: "#fbbf24",
      },
      interview: {
        subject: "Interview Invitation",
        message:
          "Congratulations! We would like to invite you for an interview.",
        color: "#3b82f6",
      },
      accepted: {
        subject: "Application Accepted - Congratulations! 🎉",
        message:
          "We are pleased to inform you that your application has been accepted!",
        color: "#10b981",
      },
      rejected: {
        subject: "Application Status Update",
        message:
          "Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.",
        color: "#ef4444",
      },
    };

    const statusInfo = statusMessages[newStatus];
    if (!statusInfo) return;

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || "HR Department"}" <${
        process.env.EMAIL_USER
      }>`,
      to: application.email,
      subject: statusInfo.subject,
      html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: ${
                          statusInfo.color
                        }; color: white; padding: 30px; 
                                 text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${statusInfo.subject}</h1>
                        </div>
                        <div class="content">
                            <p>Dear <strong>${application.firstName} ${
        application.lastName
      }</strong>,</p>
                            <p>${statusInfo.message}</p>
                            <p><strong>Application Number:</strong> ${
                              application.applicationNumber
                            }</p>
                            <p><strong>Position:</strong> ${
                              application.position
                            }</p>
                            ${
                              application.notes
                                ? `<p><strong>Additional Notes:</strong> ${application.notes}</p>`
                                : ""
                            }
                            <p>Best regards,<br>${
                              process.env.COMPANY_NAME || "HR Department"
                            }</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} ${
        process.env.COMPANY_NAME || "Company Name"
      }. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Status update email sent to ${application.email}`);
      return true;
    } catch (error) {
      console.error("❌ Email sending failed:", error);
      return false;
    }
  }
}

module.exports = EmailService;
