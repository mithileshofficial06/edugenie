require('dotenv').config();
const twilio = require('twilio');
const logger = require('../utils/logger');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsApp = async (to, message) => {
  try {
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

const formatDate = (date) => {
  if (!date) return 'No deadline set';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const sendAssignmentAlert = async (to, assignment, studyMaterial) => {
  const due = formatDate(assignment.dueDate);

  const message = studyMaterial
    ? `\u{1F9DE} EDUGENIE\n\nNEW ASSIGNMENT DETECTED\n${assignment.title}\nCourse: ${assignment.courseName}\nDue: ${due}\n\n${studyMaterial}`
    : `\u{1F9DE} EDUGENIE\n\nNEW ASSIGNMENT DETECTED\n${assignment.title}\nCourse: ${assignment.courseName}\nDue: ${due}\n\nStudy material sent to your email.\nOpen it now.`;

  return await sendWhatsApp(to, message.trim());
};

const sendQuizAlert = async (to, quiz, questionBank) => {
  const due = formatDate(quiz.dueDate);

  const message = questionBank
    ? `\u{1F9DE} EDUGENIE\n\nNEW QUIZ DETECTED\n${quiz.title}\nCourse: ${quiz.courseName}\nDue: ${due}\n\n${questionBank}`
    : `\u{1F9DE} EDUGENIE\n\nNEW QUIZ DETECTED\n${quiz.title}\nCourse: ${quiz.courseName}\nDue: ${due}\n\nQuestion bank sent to your email.\nOpen it now and start preparing.`;

  return await sendWhatsApp(to, message.trim());
};

const sendResourceAlert = async (to, resource) => {
  const message = `\u{1F9DE} EDUGENIE\n\nNEW STUDY MATERIAL\nSubject: ${resource.courseName}\nFile: ${resource.title}\n\nAccess here:\n${resource.resourceUrl || 'Check Moodle for the file.'}\n\nDetails sent to your email.`;

  return await sendWhatsApp(to, message.trim());
};

const sendDeadlineReminder = async (to, assignment) => {
  const due = formatDate(assignment.dueDate);
  const time = formatTime(assignment.dueDate);

  const message = `\u{1F9DE} EDUGENIE ALERT\n\nDEADLINE TOMORROW\n${assignment.title}\nCourse: ${assignment.courseName}\nDue: ${due} ${time}\n\n24 hours remaining.\nDo not wait. Start now.`;

  return await sendWhatsApp(to, message.trim());
};

const sendEarlyReminder = async (to, assignment, daysLeft) => {
  const due = formatDate(assignment.dueDate);
  const time = formatTime(assignment.dueDate);

  const message = `\u{1F9DE} EDUGENIE ALERT\n\n${daysLeft} DAYS REMAINING\n${assignment.title}\nCourse: ${assignment.courseName}\nDue: ${due} ${time}\n\nPlan your time. Start working on it now.`;

  return await sendWhatsApp(to, message.trim());
};

const sendUrgentReminder = async (to, assignment, hoursLeft) => {
  const due = formatDate(assignment.dueDate);
  const time = formatTime(assignment.dueDate);

  let message;
  if (hoursLeft <= 1) {
    message = `\u{1F9DE} EDUGENIE ALERT\n\nFINAL WARNING\n${assignment.title}\nCourse: ${assignment.courseName}\nDue: In 60 minutes\n\nLast reminder.\nSubmit immediately.`;
  } else {
    message = `\u{1F9DE} EDUGENIE ALERT\n\n2 HOURS REMAINING\n${assignment.title}\nCourse: ${assignment.courseName}\nDue: ${due} ${time}\n\nStop everything.\nSubmit this now.`;
  }

  return await sendWhatsApp(to, message.trim());
};

module.exports = {
  sendWhatsApp,
  sendAssignmentAlert,
  sendQuizAlert,
  sendResourceAlert,
  sendDeadlineReminder,
  sendEarlyReminder,
  sendUrgentReminder
};