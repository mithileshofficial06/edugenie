const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  moodleToken: {
    type: String,
    required: true
  },
  whatsappNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  moodleUrl: {
    type: String,
    default: 'https://moodle.licet.ac.in'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  semesterStart: {
    type: Date,
    required: true
  },
  semesterEnd: {
    type: Date,
    required: true
  },
  selectedCourseIds: {
    type: [String],
    default: []
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);