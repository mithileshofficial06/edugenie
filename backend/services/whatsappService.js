require('dotenv').config();
const twilio = require('twilio');
const logger = require('../utils/logger');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsApp = async (to, message) => {
  try {
    // Truncate message if it exceeds WhatsApp's 1600 char limit
    const truncatedMsg = message.length > 1500
      ? message.substring(0, 1497) + '...'
      : message;

    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: truncatedMsg
    });
    logger.success(`WhatsApp sent to ${to} (SID: ${result.sid})`);
    return true;
  } catch (error) {
    logger.error(`WhatsApp error to ${to}: ${error.message}`);
    if (error.code) {
      logger.error(`Twilio error code: ${error.code} — ${error.moreInfo || ''}`);
    }
    return false;
  }
};

const sendAssignmentAlert = async (to, assignment, studyMaterial) => {
  const dueDate = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleDateString('en-IN')
    : 'No deadline set';

  const message = `
🧞 *EduGenie Alert!*

📄 *New Assignment Detected!*
📚 Course: ${assignment.courseName}
📝 Title: ${assignment.title}
📅 Due: ${dueDate}

${studyMaterial
  ? `✅ *Study Material Ready:*\n${studyMaterial}`
  : `⚠️ No notes found. Here's AI generated material — please verify with your professor.`}

💪 You got this!
  `.trim();

  return await sendWhatsApp(to, message);
};

const sendQuizAlert = async (to, quiz, questionBank) => {
  const dueDate = quiz.dueDate
    ? new Date(quiz.dueDate).toLocaleDateString('en-IN')
    : 'No deadline set';

  const message = `
🧞 *EduGenie Alert!*

📝 *New Quiz Detected!*
📚 Course: ${quiz.courseName}
🎯 Title: ${quiz.title}
📅 Due: ${dueDate}

${questionBank
  ? `✅ *Mock Questions Ready:*\n${questionBank}`
  : `⚠️ No notes found. AI generated questions — please verify!`}

📖 Start preparing now!
  `.trim();

  return await sendWhatsApp(to, message);
};

const sendDeadlineReminder = async (to, assignment) => {
  const dueDate = new Date(assignment.dueDate).toLocaleDateString('en-IN');
  const hoursLeft = Math.round((assignment.dueDate - Date.now()) / 3600000);

  const message = `
🚨 *EduGenie Reminder!*

⏰ Deadline approaching!
📝 ${assignment.title}
📚 ${assignment.courseName}
📅 Due: ${dueDate}
⏳ ${hoursLeft} hours left!

Don't forget to submit! 💪
  `.trim();

  return await sendWhatsApp(to, message);
};

const sendEarlyReminder = async (to, assignment, daysLeft) => {
  const dueDate = new Date(assignment.dueDate).toLocaleDateString('en-IN');

  const message = `
📢 *EduGenie Heads Up!*

📝 ${assignment.title}
📚 ${assignment.courseName}
📅 Due: ${dueDate}
⏳ ${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining

🗓️ Plan your time wisely! Start working on it soon.
  `.trim();

  return await sendWhatsApp(to, message);
};

const sendUrgentReminder = async (to, assignment, hoursLeft) => {
  const dueDate = new Date(assignment.dueDate).toLocaleDateString('en-IN');

  const message = `
🚨🚨 *URGENT — EduGenie Alert!*

⏰ Only *${hoursLeft} hours* left!
📝 ${assignment.title}
📚 ${assignment.courseName}
📅 Due: ${dueDate}

⚡ Submit NOW if ready, or finish up ASAP!
  `.trim();

  return await sendWhatsApp(to, message);
};

module.exports = {
  sendWhatsApp,
  sendAssignmentAlert,
  sendQuizAlert,
  sendDeadlineReminder,
  sendEarlyReminder,
  sendUrgentReminder
};