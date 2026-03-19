const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  moodleAssignmentId: {
    type: String,
    required: true
  },
  title: String,
  description: String,
  dueDate: Date,
  courseId: String,
  courseName: String,
  type: {
    type: String,
    enum: ['assignment', 'quiz', 'notes', 'resource'],
    default: 'assignment'
  },
  quizType: {
    type: String,
    enum: ['mcq', 'descriptive', 'unknown'],
    default: 'unknown'
  },
  resourceUrl: String,
  isNotified: {
    type: Boolean,
    default: false
  },
  studyMaterialGenerated: {
    type: Boolean,
    default: false
  },
  reminders: {
    threeDays: { type: Boolean, default: false },
    oneDay: { type: Boolean, default: false },
    twoHours: { type: Boolean, default: false }
  },
  detectedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assignment', assignmentSchema);