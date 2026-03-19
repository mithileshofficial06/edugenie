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
  moodleUrl: {
    type: String,
    default: 'https://moodle.licet.ac.in'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);