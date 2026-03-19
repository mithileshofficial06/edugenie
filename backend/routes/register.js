const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { getMoodleCourses } = require('../services/moodleService');
const { sendWelcomeEmail } = require('../services/emailService');
const { sendWhatsApp } = require('../services/whatsappService');
const logger = require('../utils/logger');

// POST /api/register
router.post('/', async (req, res) => {
  try {
    const { moodleToken, whatsappNumber, moodleUrl, semesterStart, semesterEnd, email } = req.body;

    if (!moodleToken || !whatsappNumber || !email) {
      return res.status(400).json({
        success: false,
        message: 'Moodle token, WhatsApp number, and email are required'
      });
    }

    if (!semesterStart || !semesterEnd) {
      return res.status(400).json({
        success: false,
        message: 'Semester start and end dates are required'
      });
    }

    // Check if student already registered
    const existing = await Student.findOne({ moodleToken });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Already registered. EduGenie is monitoring your Moodle.'
      });
    }

    const finalUrl = moodleUrl || 'https://moodle.licet.ac.in';
    const semStart = new Date(semesterStart);
    const semEnd = new Date(semesterEnd);

    // Fetch all courses and filter by semester date range
    let selectedCourseIds = [];
    try {
      const allCourses = await getMoodleCourses(moodleToken, finalUrl);
      selectedCourseIds = allCourses
        .filter(course => {
          const courseStart = course.startdate ? new Date(course.startdate * 1000) : null;
          const courseEnd = course.enddate ? new Date(course.enddate * 1000) : null;
          if (!courseStart) return true;
          const startsBeforeSemEnd = courseStart <= semEnd;
          const endsAfterSemStart = !courseEnd || courseEnd.getTime() === 0 || courseEnd >= semStart;
          return startsBeforeSemEnd && endsAfterSemStart;
        })
        .map(c => String(c.id));

      logger.info(`Filtered ${selectedCourseIds.length} courses within semester range (out of ${allCourses.length} total)`);
    } catch (fetchErr) {
      logger.error(`Could not fetch courses during registration: ${fetchErr.message}`);
    }

    // Save new student
    const student = new Student({
      moodleToken,
      whatsappNumber,
      email,
      moodleUrl: finalUrl,
      semesterStart: semStart,
      semesterEnd: semEnd,
      selectedCourseIds
    });
    await student.save();

    logger.success(`New student registered: ${whatsappNumber} / ${email} (${selectedCourseIds.length} courses)`);

    // Send welcome notifications
    await sendWhatsApp(whatsappNumber, `\u{1F9DE} EDUGENIE\n\nSystem activated.\nMonitoring ${selectedCourseIds.length} courses.\nWhatsApp alerts and email study material enabled.\n\nYou will never miss a deadline.`);
    await sendWelcomeEmail(email);

    res.status(201).json({
      success: true,
      message: `EduGenie activated. Monitoring ${selectedCourseIds.length} courses.`
    });

  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
});

module.exports = router;