const cron = require('node-cron');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const { getMoodleCourses, getMoodleAssignments, getMoodleQuizzes, getMoodleResources } = require('./moodleService');
const { detectNewAssignments } = require('./assignmentDetector');
const { sendAssignmentAlert, sendQuizAlert, sendResourceAlert, sendDeadlineReminder, sendEarlyReminder, sendUrgentReminder } = require('./whatsappService');
const { sendQuizEmail, sendAssignmentEmail, sendNotesEmail } = require('./emailService');
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

        // Determine which course IDs to use and build course name map
        let courseIds;
        const allCourses = await getMoodleCourses(student.moodleToken, student.moodleUrl);
        const courseNameMap = {};
        for (const c of allCourses) {
          courseNameMap[c.id] = c.fullname || c.shortname || c.displayname || 'Unknown Course';
        }

        if (student.selectedCourseIds && student.selectedCourseIds.length > 0) {
          courseIds = student.selectedCourseIds.map(id => Number(id));
          logger.info(`Step 1: Using ${courseIds.length} pre-selected semester courses`);
        } else {
          courseIds = allCourses.map(c => c.id);
          logger.info(`Step 1: No selectedCourseIds — using all ${courseIds.length} Moodle courses`);
        }

        if (courseIds.length === 0) {
          logger.warn(`No courses for student ${student._id}. Skipping.`);
          continue;
        }

        // Step 2 — Fetch assignments and quizzes from selected courses only
        logger.info('Step 2: Fetching assignments and quizzes...');
        const assignments = await getMoodleAssignments(student.moodleToken, student.moodleUrl, courseIds);
        const quizzes = await getMoodleQuizzes(student.moodleToken, student.moodleUrl, courseIds);
        const totalAssignments = assignments.reduce((sum, c) => sum + (c.assignments?.length || 0), 0);
        logger.info(`Step 2 result: ${totalAssignments} assignment(s), ${quizzes.length} quiz(zes)`);

        // Step 3 — Detect new items (registration-date and deadline aware)
        logger.info('Step 3: Detecting new items (filtering old/past-deadline)...');
        const courses = assignments;
        const newItems = await detectNewAssignments(student._id, courses, assignments, quizzes, student, courseNameMap);
        logger.info(`Step 3 result: ${newItems.length} genuinely-new item(s) to alert`);

        // Step 4 — Generate AI content, send WhatsApp alert + Email with full content
        if (newItems.length > 0) {
          logger.info('Step 4: Generating AI content & sending alerts...');
        }
        for (const item of newItems) {
          try {
            if (item.dueDate && item.dueDate < new Date()) {
              logger.info(`  - Skipping past-deadline item: "${item.title}"`);
              item.isNotified = true;
              await item.save();
              continue;
            }

            if (item.type === 'quiz') {
              // Generate question bank
              logger.info(`  → Generating question bank for quiz: "${item.title}"`);
              const questionBank = await generateQuestionBank(item.title, item.courseName);

              // WhatsApp — short alert
              logger.info(`  → Sending quiz WhatsApp alert to ${student.whatsappNumber}`);
              await sendQuizAlert(student.whatsappNumber, item, null);

              // Email — full question bank
              if (student.email) {
                logger.info(`  → Sending quiz email to ${student.email}`);
                await sendQuizEmail(student.email, item, questionBank);
              }
            } else if (item.type === 'assignment') {
              // Generate study document
              const pageCount = extractPageCount(item.description);
              logger.info(`  → Generating study doc for assignment: "${item.title}" (${pageCount} pages)`);
              const studyDoc = await generateStudyDocument(item.title, item.courseName, pageCount);

              // WhatsApp — short alert
              logger.info(`  → Sending assignment WhatsApp alert to ${student.whatsappNumber}`);
              await sendAssignmentAlert(student.whatsappNumber, item, null);

              // Email — full study document
              if (student.email) {
                logger.info(`  → Sending assignment email to ${student.email}`);
                await sendAssignmentEmail(student.email, item, studyDoc);
              }
            } else {
              logger.info(`  → Skipping notes item: "${item.title}"`);
            }

            item.isNotified = true;
            item.studyMaterialGenerated = true;
            await item.save();
            logger.success(`  Done: "${item.title}"`);
          } catch (itemError) {
            logger.error(`  Error processing item "${item.title}": ${itemError.message}`);
          }
        }

        // Step 5 — Check for new resources/notes
        logger.info('Step 5: Checking for new resources/notes...');
        await checkNewResources(student, courseIds, courseNameMap);

        // Step 6 — Check upcoming deadlines (multi-tier reminders)
        logger.info('Step 6: Checking upcoming deadlines...');
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
 * Check for new resources/notes uploaded to Moodle
 */
const checkNewResources = async (student, courseIds, courseNameMap = {}) => {
  try {
    const resources = await getMoodleResources(student.moodleToken, student.moodleUrl, courseIds);

    for (const resource of resources) {
      const exists = await Assignment.findOne({
        studentId: student._id,
        moodleAssignmentId: `resource_${resource.id}`
      });

      if (!exists) {
        const registeredAt = student.registeredAt || student.createdAt || new Date(0);
        const resourceTime = resource.timemodified ? resource.timemodified * 1000 : 0;
        const isOld = resourceTime > 0 && resourceTime < registeredAt.getTime();

        const resourceUrl = `${student.moodleUrl}/mod/resource/view.php?id=${resource.coursemodule || resource.id}`;
        const courseName = courseNameMap[resource.course] || resource.coursename || 'Unknown Course';

        const newResource = new Assignment({
          studentId: student._id,
          moodleAssignmentId: `resource_${resource.id}`,
          title: resource.name,
          description: resource.intro || '',
          courseId: String(resource.course),
          courseName,
          type: 'resource',
          resourceUrl,
          isNotified: isOld,
          studyMaterialGenerated: isOld,
        });
        await newResource.save();

        if (!isOld) {
          // WhatsApp — short alert with link
          await sendResourceAlert(student.whatsappNumber, newResource);

          // Email — formatted notes email
          if (student.email) {
            await sendNotesEmail(student.email, newResource, courseName);
          }

          newResource.isNotified = true;
          await newResource.save();
          logger.info(`  New resource detected and notified: "${resource.name}"`);
        } else {
          logger.info(`  Silently saved old resource: "${resource.name}"`);
        }
      }
    }
  } catch (error) {
    logger.error(`  Resource check error: ${error.message}`);
  }
};

/**
 * Multi-tier deadline reminder system
 */
const checkDeadlineReminders = async (student) => {
  const now = new Date();

  const upcomingItems = await Assignment.find({
    studentId: student._id,
    dueDate: { $gt: now },
    isNotified: true
  });

  for (const item of upcomingItems) {
    if (!item.dueDate) continue;

    const hoursUntilDue = (item.dueDate.getTime() - now.getTime()) / 3600000;
    const reminders = item.reminders || {};

    try {
      if (hoursUntilDue <= 2.5 && hoursUntilDue >= 1.5 && !reminders.twoHours) {
        await sendUrgentReminder(student.whatsappNumber, item, Math.round(hoursUntilDue));
        item.reminders = { ...reminders, twoHours: true };
        await item.save();
        logger.info(`  2-hour urgent reminder sent for: "${item.title}"`);
      }
      else if (hoursUntilDue <= 26 && hoursUntilDue >= 22 && !reminders.oneDay) {
        await sendDeadlineReminder(student.whatsappNumber, item);
        item.reminders = { ...reminders, oneDay: true };
        await item.save();
        logger.info(`  1-day reminder sent for: "${item.title}"`);
      }
      else if (hoursUntilDue <= 74 && hoursUntilDue >= 70 && !reminders.threeDays) {
        const daysLeft = Math.ceil(hoursUntilDue / 24);
        await sendEarlyReminder(student.whatsappNumber, item, daysLeft);
        item.reminders = { ...reminders, threeDays: true };
        await item.save();
        logger.info(`  3-day early reminder sent for: "${item.title}"`);
      }
    } catch (error) {
      logger.error(`  Reminder error for "${item.title}": ${error.message}`);
    }
  }
};

const startScheduler = () => {
  cron.schedule('0 */2 * * *', runPipeline);
  logger.info('Scheduler started — running every 2 hours');
  runPipeline();
};

module.exports = { startScheduler, runPipeline };