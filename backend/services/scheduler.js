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

        // Step 3 — Detect new items (now registration-date and deadline aware)
        logger.info('Step 3: Detecting new items (filtering old/past-deadline)...');
        const newItems = await detectNewAssignments(student._id, courses, assignments, quizzes, student);
        logger.info(`Step 3 result: ${newItems.length} genuinely-new item(s) to alert`);

        // Step 4 — Generate AI content and send WhatsApp (only for genuinely new items)
        if (newItems.length > 0) {
          logger.info('Step 4: Generating AI content & sending WhatsApp alerts...');
        }
        for (const item of newItems) {
          try {
            // Double-check: skip if due date has somehow passed between detection and now
            if (item.dueDate && item.dueDate < new Date()) {
              logger.info(`  ⊘ Skipping past-deadline item: "${item.title}"`);
              item.isNotified = true;
              await item.save();
              continue;
            }

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
 * Multi-tier deadline reminder system with precise time-window checks:
 *   - 3 days before deadline  (70–74 hr window)
 *   - 1 day before deadline   (22–26 hr window)
 *   - 2 hours before deadline (1.5–2.5 hr window)
 */
const checkDeadlineReminders = async (student) => {
  const now = new Date();

  // Only get assignments with a FUTURE due date that have been notified already
  const upcomingItems = await Assignment.find({
    studentId: student._id,
    dueDate: { $gt: now },     // strictly future — past deadlines are completely ignored
    isNotified: true
  });

  for (const item of upcomingItems) {
    // Skip items with no due date (shouldn't exist here due to query, but safety check)
    if (!item.dueDate) continue;

    const hoursUntilDue = (item.dueDate.getTime() - now.getTime()) / 3600000;
    const reminders = item.reminders || {};

    try {
      // 2-hour urgent reminder (1.5 – 2.5 hr window)
      if (hoursUntilDue <= 2.5 && hoursUntilDue >= 1.5 && !reminders.twoHours) {
        await sendUrgentReminder(student.whatsappNumber, item, Math.round(hoursUntilDue));
        item.reminders = { ...reminders, twoHours: true };
        await item.save();
        logger.info(`  ⏰ 2-hour urgent reminder sent for: "${item.title}"`);
      }
      // 1-day reminder (22 – 26 hr window)
      else if (hoursUntilDue <= 26 && hoursUntilDue >= 22 && !reminders.oneDay) {
        await sendDeadlineReminder(student.whatsappNumber, item);
        item.reminders = { ...reminders, oneDay: true };
        await item.save();
        logger.info(`  📅 1-day reminder sent for: "${item.title}"`);
      }
      // 3-day reminder (70 – 74 hr window)
      else if (hoursUntilDue <= 74 && hoursUntilDue >= 70 && !reminders.threeDays) {
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