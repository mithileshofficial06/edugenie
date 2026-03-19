const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const logger = require('../utils/logger');

// POST /api/register
router.post('/', async (req, res) => {
  try {
    const { moodleToken, whatsappNumber, moodleUrl } = req.body;

    if (!moodleToken || !whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'Moodle token and WhatsApp number are required'
      });
    }

    // Check if student already registered
    const existing = await Student.findOne({ moodleToken });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Already registered! EduGenie is watching your Moodle 🧞'
      });
    }

    // Save new student
    const student = new Student({
      moodleToken,
      whatsappNumber,
      moodleUrl: moodleUrl || 'https://moodle.licet.ac.in'
    });
    await student.save();

    logger.success(`New student registered: ${whatsappNumber}`);
    res.status(201).json({
      success: true,
      message: 'EduGenie activated! You will receive WhatsApp alerts 🧞🔥'
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