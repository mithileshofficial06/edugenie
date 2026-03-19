const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const { getMoodleCourses, getMoodleAssignments, getMoodleQuizzes } = require('../services/moodleService');
const { runPipeline } = require('../services/scheduler');
const { sendWhatsApp } = require('../services/whatsappService');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

router.use((req, res, next) => {
  if (isProduction) {
    const key = req.headers['x-debug-key'];
    if (!key || key !== process.env.DEBUG_SECRET) {
      return res.status(404).json({ 
        message: 'Not found' 
      });
    }
  }
  next();
});

// GET /api/debug/run-pipeline — manually trigger the full pipeline
router.get('/run-pipeline', async (req, res) => {
  try {
    logger.info('Manual pipeline trigger via debug endpoint');
    await runPipeline();
    res.json({ success: true, message: 'Pipeline executed successfully. Check server logs for details.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/debug/test-moodle/:studentId — test Moodle API connectivity
router.get('/test-moodle/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const courses = await getMoodleCourses(student.moodleToken, student.moodleUrl);
    const courseIds = courses.map(c => c.id);

    let assignments = [];
    let quizzes = [];
    if (courseIds.length > 0) {
      assignments = await getMoodleAssignments(student.moodleToken, student.moodleUrl, courseIds);
      quizzes = await getMoodleQuizzes(student.moodleToken, student.moodleUrl, courseIds);
    }

    res.json({
      success: true,
      student: { id: student._id, whatsapp: student.whatsappNumber, moodleUrl: student.moodleUrl },
      moodle: {
        coursesFound: courses.length,
        courses: courses.map(c => ({ id: c.id, name: c.fullname || c.shortname })),
        assignmentCourses: assignments.length,
        totalAssignments: assignments.reduce((sum, c) => sum + (c.assignments?.length || 0), 0),
        quizzesFound: quizzes.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/debug/test-whatsapp/:studentId — send a test WhatsApp message
router.get('/test-whatsapp/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await sendWhatsApp(student.whatsappNumber, '🧞 EduGenie test — Your WhatsApp connection is working! 🎉');
    res.json({ success: true, message: `Test message sent to ${student.whatsappNumber}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/debug/students — list all registered students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find({}, '-moodleToken');
    const assignments = await Assignment.find({});
    res.json({
      success: true,
      students: students,
      totalAssignments: assignments.length,
      notified: assignments.filter(a => a.isNotified).length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
