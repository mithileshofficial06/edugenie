const cron = require('node-cron');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const { getMoodleCourses, getMoodleAssignments, getMoodleQuizzes } = require('./moodleService');
const { detectNewAssignments } = require('./assignmentDetector');
const { sendAssignmentAlert, sendQuizAlert, sendDeadlineReminder, sendEarlyReminder, sendUrgentReminder } = require('./whatsappService');
const { generateQuestionBank, generateStudyDocument } = require('./aiService');
const { extractPageCount } = require('./contentClassifier');
const logger = require('../utils/logger');

const runPipeline = async () => {
  logger.info('═══════════════════════════════════════');
  logger.info('EduGenie pipeline started...');

  try {
    const students = await Student.find({ isActive: true });
    logger.info(`Found ${students.length} active student(s)`);

    if (students.length === 0) {
      logger.warn('No active students found. Pipeline skipped.');
      return;
    }

    for (const student of students) {
      try {
        logger.info(`───── Processing student: ${student._id} (${student.whatsappNumber}) ─────`);

        // Step 1 — Fetch courses
        logger.info('Step 1: Fetching Moodle courses...');
        const courses = await getMoodleCourses(student.moodleToken, student.moodleUrl);
        const courseIds = courses.map(c => c.id);
        logger.info(`Step 1 result: ${courses.length} course(s) found → [${courses.map(c => c.shortname || c.fullname).join(', ')}]`);

        if (courseIds.length === 0) {
          logger.warn(`No courses found for student ${student._id}. Skipping.`);
          continue;
        }

        // Step 2 — Fetch assignments and quizzes
        logger.info('Step 2: Fetching assignments and quizzes...');
        const assignments = await getMoodleAssignments(student.moodleToken, student.moodleUrl, courseIds);
        const quizzes = await getMoodleQuizzes(student.moodleToken, student.moodleUrl, courseIds);
        const totalAssignments = assignments.reduce((sum, c) => sum + (c.assignments?.length || 0), 0);
        logger.info(`Step 2 result: ${totalAssignments} assignment(s), ${quizzes.length} quiz(zes)`);

        // Step 3 — Detect new items
        logger.info('Step 3: Detecting new items...');
        const newItems = await detectNewAssignments(student._id, courses, assignments, quizzes);
        logger.info(`Step 3 result: ${newItems.length} NEW item(s) detected`);

        // Step 4 — Generate AI content and send WhatsApp
        if (newItems.length > 0) {
          logger.info('Step 4: Generating AI content & sending WhatsApp alerts...');
        }
        for (const item of newItems) {
          try {
            if (item.type === 'quiz') {
              logger.info(`  → Generating question bank for quiz: "${item.title}"`);
              const questionBank = await generateQuestionBank(item.title, item.courseName);
              logger.info(`  → Sending quiz alert to ${student.whatsappNumber}`);
              await sendQuizAlert(student.whatsappNumber, item, questionBank);
            } else if (item.type === 'assignment') {
              const pageCount = extractPageCount(item.description);
              logger.info(`  → Generating study doc for assignment: "${item.title}" (${pageCount} pages)`);
              const studyDoc = await generateStudyDocument(item.title, item.courseName, pageCount);
              logger.info(`  → Sending assignment alert to ${student.whatsappNumber}`);
              await sendAssignmentAlert(student.whatsappNumber, item, studyDoc);
            } else {
              logger.info(`  → Skipping notes item: "${item.title}" (no alert needed)`);
            }
            item.isNotified = true;
            item.studyMaterialGenerated = true;
            await item.save();
            logger.success(`  ✓ Item processed: "${item.title}"`);
          } catch (itemError) {
            logger.error(`  ✗ Error processing item "${item.title}": ${itemError.message}`);
          }
        }

        // Step 5 — Check upcoming deadlines (multi-tier reminders)
        logger.info('Step 5: Checking upcoming deadlines...');
        await checkDeadlineReminders(student);

      } catch (error) {
        logger.error(`Pipeline error for student ${student._id}: ${error.message}`);
        if (error.stack) {
          logger.error(`Stack: ${error.stack.split('\n').slice(0, 3).join(' → ')}`);
        }
      }
    }
  } catch (error) {
    logger.error(`Fatal pipeline error: ${error.message}`);
  }

  logger.info('EduGenie pipeline completed!');
  logger.info('═══════════════════════════════════════');
};

/**
 * Multi-tier deadline reminder system:
 *   - 3 days before deadline
 *   - 1 day before deadline
 *   - 2 hours before deadline
 */
const checkDeadlineReminders = async (student) => {
  const now = Date.now();

  // Find all assignments with a due date in the future that have been notified
  const upcomingItems = await Assignment.find({
    studentId: student._id,
    dueDate: { $gte: new Date() },
    isNotified: true
  });

  for (const item of upcomingItems) {
    const hoursUntilDue = (item.dueDate.getTime() - now) / 3600000;
    const reminders = item.reminders || {};

    try {
      // 2-hour reminder (most urgent)
      if (hoursUntilDue <= 2 && hoursUntilDue > 0 && !reminders.twoHours) {
        await sendUrgentReminder(student.whatsappNumber, item, Math.round(hoursUntilDue));
        item.reminders = { ...reminders, twoHours: true };
        await item.save();
        logger.info(`  ⏰ 2-hour urgent reminder sent for: "${item.title}"`);
      }
      // 1-day reminder
      else if (hoursUntilDue <= 24 && hoursUntilDue > 2 && !reminders.oneDay) {
        await sendDeadlineReminder(student.whatsappNumber, item);
        item.reminders = { ...reminders, oneDay: true };
        await item.save();
        logger.info(`  📅 1-day reminder sent for: "${item.title}"`);
      }
      // 3-day reminder
      else if (hoursUntilDue <= 72 && hoursUntilDue > 24 && !reminders.threeDays) {
        const daysLeft = Math.ceil(hoursUntilDue / 24);
        await sendEarlyReminder(student.whatsappNumber, item, daysLeft);
        item.reminders = { ...reminders, threeDays: true };
        await item.save();
        logger.info(`  📢 3-day early reminder sent for: "${item.title}"`);
      }
    } catch (error) {
      logger.error(`  Reminder error for "${item.title}": ${error.message}`);
    }
  }
};

const startScheduler = () => {
  // Runs every 2 hours
  cron.schedule('0 */2 * * *', runPipeline);
  logger.info('Scheduler started — running every 2 hours');
  // Run immediately on start
  runPipeline();
};

module.exports = { startScheduler, runPipeline };