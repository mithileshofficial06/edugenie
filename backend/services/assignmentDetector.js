const Assignment = require('../models/Assignment');
const { classifyContent } = require('./contentClassifier');
const logger = require('../utils/logger');

const detectNewAssignments = async (studentId, moodleCourses, moodleAssignments, moodleQuizzes) => {
  const newItems = [];

  // Check assignments
  for (const course of moodleAssignments) {
    for (const assign of course.assignments || []) {
      const exists = await Assignment.findOne({
        studentId,
        moodleAssignmentId: `assign_${assign.id}`
      });

      if (!exists) {
        const type = classifyContent(assign.name, assign.intro || '');
        const newAssignment = new Assignment({
          studentId,
          moodleAssignmentId: `assign_${assign.id}`,
          title: assign.name,
          description: assign.intro || '',
          dueDate: assign.duedate ? new Date(assign.duedate * 1000) : null,
          courseId: course.id,
          courseName: course.fullname,
          type
        });
        await newAssignment.save();
        newItems.push(newAssignment);
        logger.info(`New ${type} detected: ${assign.name}`);
      }
    }
  }

  // Check quizzes
  for (const quiz of moodleQuizzes) {
    const exists = await Assignment.findOne({
      studentId,
      moodleAssignmentId: `quiz_${quiz.id}`
    });

    if (!exists) {
      const newQuiz = new Assignment({
        studentId,
        moodleAssignmentId: `quiz_${quiz.id}`,
        title: quiz.name,
        description: quiz.intro || '',
        dueDate: quiz.timeclose ? new Date(quiz.timeclose * 1000) : null,
        courseId: quiz.course,
        courseName: quiz.coursename || 'Unknown Course',
        type: 'quiz'
      });
      await newQuiz.save();
      newItems.push(newQuiz);
      logger.info(`New quiz detected: ${quiz.name}`);
    }
  }

  return newItems;
};

module.exports = { detectNewAssignments };