/**
 * @module email/service
 */

import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends blocker notification email to TA
 *
 * @param {Object} emailData - Email data
 * @param {string} emailData.studentName - Student's full name
 * @param {string} emailData.studentEmail - Student's email
 * @param {string} emailData.teamName - Team name
 * @param {string} emailData.courseName - Course name
 * @param {string} emailData.blockerContent - The blocker text
 * @returns {Promise<void>}
 * @memberof module:email/service
 */
async function sendBlockerNotification(emailData) {
  const { studentName, studentEmail, teamName, courseName, blockerContent } = emailData;

  const msg = {
    to: process.env.SENDGRID_TO_EMAIL,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Blocker Reported - ${studentName}`,
    text: `
Blocker Reported

Student: ${studentName}
Email: ${studentEmail}
Team: ${teamName}
Course: ${courseName}

Blocker:
${blockerContent}
    `.trim()
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    throw error;
  }
}

export { sendBlockerNotification };
