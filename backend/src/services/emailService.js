/**
 * @module email/service
 */

import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends blocker notification email to TA
 *
 * @param {Object} emailData - Email data
 * @param {string} emailData.taEmail - TA's email address
 * @param {string} emailData.studentName - Student's full name
 * @param {string} emailData.studentEmail - Student's email
 * @param {string} emailData.teamName - Team name
 * @param {string} emailData.courseName - Course name
 * @param {string} emailData.blockerContent - The blocker text
 * @returns {Promise<void>}
 * @memberof module:email/service
 */
async function sendBlockerNotification(emailData) {
  const { taEmail, studentName, studentEmail, teamName, courseName, blockerContent } = emailData;

  const msg = {
    to: taEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `[${courseName}] Blocker Reported by ${studentName}`,
    text: `
Hi,

A student on your team has reported a blocker and may need assistance.

Course: ${courseName}
Team: ${teamName}
Student: ${studentName} (${studentEmail})

Blocker Details:
${blockerContent}

Please reach out to the student when you have a chance.

---
This is an automated notification from Conductor.
    `.trim()
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    throw error;
  }
}

export { sendBlockerNotification };
