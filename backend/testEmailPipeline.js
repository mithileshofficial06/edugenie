/**
 * testEmailPipeline.js — Simulates a full pipeline run with email delivery.
 * 
 * Picks a real course from Moodle, generates MCQs using Mistral AI,
 * and sends the formatted quiz email to the student.
 * 
 * Usage: node testEmailPipeline.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const { getMoodleCourses, getMoodleResources } = require('./services/moodleService');
const { extractTextFromResource } = require('./services/pdfService');
const { generateQuestionBank } = require('./services/aiService');
const { sendQuizEmail } = require('./services/emailService');
const { sendWhatsApp } = require('./services/whatsappService');
const logger = require('./utils/logger');

const run = async () => {
  logger.info('═══════════════════════════════════════');
  logger.info('EMAIL PIPELINE TEST — Full Simulation');
  logger.info('═══════════════════════════════════════');

  // Step 1 — Connect to MongoDB and find active student
  await mongoose.connect(process.env.MONGODB_URI);
  logger.success('MongoDB connected');

  const student = await Student.findOne({ isActive: true });
  if (!student) {
    logger.error('No active student found.');
    process.exit(1);
  }
  logger.success(`Student: ${student.whatsappNumber} | Email: ${student.email}`);

  // Step 2 — Fetch courses and pick one that has resources
  logger.info('\nStep 1: Fetching courses from Moodle...');
  const courses = await getMoodleCourses(student.moodleToken, student.moodleUrl);
  
  // Use selected course IDs if available
  const selectedIds = student.selectedCourseIds?.map(id => Number(id)) || [];
  const targetCourses = selectedIds.length > 0
    ? courses.filter(c => selectedIds.includes(c.id))
    : courses;

  logger.info(`Found ${targetCourses.length} semester courses`);

  // Step 3 — Try to find a course with resources/notes
  logger.info('\nStep 2: Looking for a course with study materials...');
  let pickedCourse = null;
  let extractedNotes = null;

  for (const course of targetCourses) {
    try {
      const resources = await getMoodleResources(student.moodleToken, student.moodleUrl, [course.id]);
      if (resources && resources.length > 0) {
        pickedCourse = course;
        logger.success(`Found course with resources: "${course.fullname}" (${resources.length} resources)`);

        // Try to extract text from first resource
        for (const resource of resources) {
          if (resource.contentfiles && resource.contentfiles.length > 0) {
            const file = resource.contentfiles[0];
            logger.info(`  Trying to extract: "${resource.name}" — ${file.filename}`);
            const text = await extractTextFromResource(file.fileurl, student.moodleToken);
            if (text && text.length > 100) {
              extractedNotes = text;
              logger.success(`  Extracted ${text.length} chars from "${resource.name}"`);
              break;
            }
          }
        }
        break;
      }
    } catch (err) {
      // Continue to next course
    }
  }

  // If no course with resources, just pick the first semester course
  if (!pickedCourse) {
    pickedCourse = targetCourses[0];
    logger.warn(`No course with resources found. Using: "${pickedCourse.fullname}"`);
  }

  logger.info(`\nUsing course: "${pickedCourse.fullname}"`);
  logger.info(`Notes: ${extractedNotes ? `YES (${extractedNotes.length} chars)` : 'NO — using topic title only'}`);

  // Step 4 — Generate MCQ question bank via AI (Mistral)
  logger.info('\nStep 3: Generating MCQ question bank via AI...');
  const questionBank = await generateQuestionBank(
    pickedCourse.fullname,
    pickedCourse.fullname,
    extractedNotes,
    'mcq'
  );

  if (!questionBank) {
    logger.error('AI generation failed! Check AI service.');
    process.exit(1);
  }

  logger.success(`MCQ bank generated: ${questionBank.length} characters`);
  console.log('\n--- PREVIEW ---');
  console.log(questionBank.substring(0, 500));
  console.log('--- END PREVIEW ---\n');

  // Step 5 — Send the quiz email
  logger.info('Step 4: Sending quiz email...');
  
  const mockQuiz = {
    title: pickedCourse.fullname,
    courseName: pickedCourse.fullname,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  };

  const emailResult = await sendQuizEmail(student.email, mockQuiz, questionBank);

  if (emailResult) {
    logger.success('═══════════════════════════════════════');
    logger.success('EMAIL SENT SUCCESSFULLY!');
    logger.success(`To: ${student.email}`);
    logger.success(`Subject: EduGenie — Quiz Prep Ready: ${pickedCourse.fullname}`);
    logger.success(`Content: ${questionBank.length} chars of MCQ content`);
    logger.success('═══════════════════════════════════════');

    // Send WhatsApp notification that email was sent
    logger.info('\nStep 5: Sending WhatsApp notification...');
    await sendWhatsApp(
      student.whatsappNumber,
      `🧞 EDUGENIE\n\n📧 STUDY MATERIAL SENT TO YOUR EMAIL\n\nQuiz: ${pickedCourse.fullname}\n\nA full Mock Question Bank with 10 practice questions has been sent to:\n${student.email}\n\nCheck your inbox now and start preparing!`
    );
    logger.success('WhatsApp notification sent!');
    logger.info('\nCheck your inbox (and spam folder) for the email!');
  } else {
    logger.error('Email sending failed. Check EMAIL_USER and EMAIL_PASS in .env');
  }

  await mongoose.disconnect();
  logger.info('Done.');
};

run().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
