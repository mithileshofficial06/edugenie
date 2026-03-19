const Assignment = require('../models/Assignment');
const { classifyContent, detectQuizType } = require('./contentClassifier');
const logger = require('../utils/logger');

/**
 * Determine whether a Moodle item was posted BEFORE the student registered.
 * Uses timemodified and timecreated (Moodle returns these as Unix seconds).
 */
const wasPostedBeforeRegistration = (moodleItem, registeredAt) => {
  const regTime = registeredAt.getTime();
  const modified = moodleItem.timemodified ? moodleItem.timemodified * 1000 : null;
  const created = moodleItem.timecreated ? moodleItem.timecreated * 1000 : null;

  // Use the latest of timemodified/timecreated as the "posted" time
  const postedTime = Math.max(modified || 0, created || 0);

  // If we have no timestamp at all, treat as old (safe default — no spam)
  if (postedTime === 0) return true;

  return postedTime < regTime;
};

/**
 * Check if a due date is already in the past.
 */
const isDueDatePassed = (dueDate) => {
  if (!dueDate) return false; // no due date ≠ past
  return dueDate < new Date();
};

const detectNewAssignments = async (studentId, moodleCourses, moodleAssignments, moodleQuizzes, student, courseNameMap = {}) => {
  const newItems = [];

  const registeredAt = student.registeredAt || student.createdAt || new Date(0);

  // ── Check assignments ──
  for (const course of moodleAssignments) {
    for (const assign of course.assignments || []) {
      const exists = await Assignment.findOne({
        studentId,
        moodleAssignmentId: `assign_${assign.id}`
      });

      if (!exists) {
        const type = classifyContent(assign.name, assign.intro || '');
        const dueDate = assign.duedate ? new Date(assign.duedate * 1000) : null;

        // Decide if we should silently mark as seen
        const isOld = wasPostedBeforeRegistration(assign, registeredAt);
        const isPastDeadline = isDueDatePassed(dueDate);
        const skipAlert = isOld || isPastDeadline;

        const newAssignment = new Assignment({
          studentId,
          moodleAssignmentId: `assign_${assign.id}`,
          title: assign.name,
          description: assign.intro || '',
          dueDate,
          courseId: course.id,
          courseName: course.fullname,
          type,
          isNotified: skipAlert,             // mark as already notified if old
          studyMaterialGenerated: skipAlert,  // skip AI generation too
        });
        await newAssignment.save();

        if (skipAlert) {
          logger.info(`  ◌ Silently saved old/past item: "${assign.name}" (old=${isOld}, pastDeadline=${isPastDeadline})`);
        } else {
          newItems.push(newAssignment);
          logger.info(`  ● New ${type} detected: "${assign.name}"`);
        }
      }
    }
  }

  // ── Check quizzes ──
  for (const quiz of moodleQuizzes) {
    const exists = await Assignment.findOne({
      studentId,
      moodleAssignmentId: `quiz_${quiz.id}`
    });

    if (!exists) {
      const dueDate = quiz.timeclose ? new Date(quiz.timeclose * 1000) : null;

      const isOld = wasPostedBeforeRegistration(quiz, registeredAt);
      const isPastDeadline = isDueDatePassed(dueDate);
      const skipAlert = isOld || isPastDeadline;

      const quizType = detectQuizType(quiz.name, quiz.intro || '', quiz);
      logger.info(`  Quiz type detected: ${quizType} for "${quiz.name}"`);

      const newQuiz = new Assignment({
        studentId,
        moodleAssignmentId: `quiz_${quiz.id}`,
        title: quiz.name,
        description: quiz.intro || '',
        dueDate,
        courseId: quiz.course,
        courseName: courseNameMap[quiz.course] || quiz.coursename || 'Unknown Course',
        type: 'quiz',
        quizType,
        isNotified: skipAlert,
        studyMaterialGenerated: skipAlert,
      });
      await newQuiz.save();

      if (skipAlert) {
        logger.info(`  ◌ Silently saved old/past quiz: "${quiz.name}" (old=${isOld}, pastDeadline=${isPastDeadline})`);
      } else {
        newItems.push(newQuiz);
        logger.info(`  ● New quiz detected: "${quiz.name}"`);
      }
    }
  }

  return newItems;
};

module.exports = { detectNewAssignments };