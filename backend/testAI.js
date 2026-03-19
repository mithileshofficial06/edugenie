/**
 * testAI.js — End-to-end AI pipeline test
 * 
 * Dynamically fetches a student's courses from Moodle,
 * finds a target subject, extracts notes/PDFs, and
 * generates MCQs using the full AI pipeline.
 * 
 * Usage: node testAI.js "Operating System"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const { getMoodleCourses, getMoodleResources } = require('./services/moodleService');
const { extractTextFromResource } = require('./services/pdfService');
const { generateQuestionBank } = require('./services/aiService');
const logger = require('./utils/logger');

const TARGET_SUBJECT = process.argv[2] || 'Operating System';

const run = async () => {
  logger.info('═══════════════════════════════════════');
  logger.info(`AI Pipeline Test — Subject: "${TARGET_SUBJECT}"`);
  logger.info('═══════════════════════════════════════');

  // Step 1 — Connect to MongoDB and find active student
  await mongoose.connect(process.env.MONGODB_URI);
  logger.success('MongoDB connected');

  const student = await Student.findOne({ isActive: true });
  if (!student) {
    logger.error('No active student found. Register first.');
    process.exit(1);
  }
  logger.success(`Found student: ${student.whatsappNumber} (${student.email})`);

  // Step 2 — Fetch all courses from Moodle
  logger.info('\nStep 1: Fetching courses from Moodle...');
  const courses = await getMoodleCourses(student.moodleToken, student.moodleUrl);
  logger.info(`Found ${courses.length} total courses`);

  // Step 3 — Find the target subject (fuzzy match)
  const searchTerm = TARGET_SUBJECT.toLowerCase();
  const matchedCourse = courses.find(c => {
    const name = (c.fullname || c.shortname || '').toLowerCase();
    return name.includes(searchTerm) || searchTerm.split(' ').every(word => name.includes(word));
  });

  if (!matchedCourse) {
    logger.error(`Course "${TARGET_SUBJECT}" not found in Moodle.`);
    logger.info('Available courses:');
    courses.forEach(c => logger.info(`  - [${c.id}] ${c.fullname}`));
    process.exit(1);
  }

  logger.success(`Matched course: "${matchedCourse.fullname}" (ID: ${matchedCourse.id})`);

  // Step 4 — Fetch resources/notes for this course
  logger.info('\nStep 2: Fetching resources/notes...');
  const resources = await getMoodleResources(student.moodleToken, student.moodleUrl, [matchedCourse.id]);
  logger.info(`Found ${resources.length} resource(s) in "${matchedCourse.fullname}"`);

  if (resources.length === 0) {
    logger.warn('No resources found. Generating MCQs from topic title only.');
  } else {
    resources.forEach((r, i) => {
      logger.info(`  ${i + 1}. ${r.name}`);
    });
  }

  // Step 5 — Try to extract text from the first available PDF/resource
  let extractedNotes = null;
  if (resources.length > 0) {
    logger.info('\nStep 3: Attempting PDF text extraction...');
    
    for (const resource of resources) {
      if (resource.contentfiles && resource.contentfiles.length > 0) {
        const file = resource.contentfiles[0];
        logger.info(`  Trying: "${resource.name}" — ${file.filename}`);
        
        const text = await extractTextFromResource(file.fileurl, student.moodleToken);
        if (text && text.length > 100) {
          extractedNotes = text;
          logger.success(`  Extracted ${text.length} characters from "${resource.name}"`);
          logger.info(`  Preview: "${text.substring(0, 200)}..."`);
          break;
        } else {
          logger.warn(`  Could not extract useful text from "${resource.name}"`);
        }
      }
    }
  }

  if (extractedNotes) {
    logger.success('\nUsing ACTUAL COURSE NOTES for AI generation');
  } else {
    logger.warn('\nNo extractable notes found — using topic title only');
  }

  // Step 6 — Generate MCQ question bank using AI
  logger.info('\nStep 4: Generating MCQ question bank...');
  logger.info(`  Subject: ${matchedCourse.fullname}`);
  logger.info(`  Quiz Type: MCQ`);
  logger.info(`  Notes: ${extractedNotes ? `${extractedNotes.length} chars` : 'None (title-only)'}`);
  logger.info('  Calling AI service...\n');

  const questionBank = await generateQuestionBank(
    matchedCourse.fullname,
    matchedCourse.fullname,
    extractedNotes,
    'mcq'
  );

  if (questionBank) {
    logger.success('═══════════════════════════════════════');
    logger.success('MCQ QUESTION BANK GENERATED SUCCESSFULLY');
    logger.success('═══════════════════════════════════════\n');
    console.log(questionBank);
    logger.info('\n═══════════════════════════════════════');
    logger.success(`Total output: ${questionBank.length} characters`);
    logger.success(`Notes used: ${extractedNotes ? 'YES — actual PDF content' : 'NO — general knowledge'}`);
  } else {
    logger.error('AI generation failed. Check your GEMINI_API_KEY and AI service.');
  }

  await mongoose.disconnect();
  logger.info('Done.');
};

run().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
