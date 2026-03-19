const axios = require('axios');
const logger = require('../utils/logger');

// Python AI microservice URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

/**
 * Generate a mock question bank — calls Python Flask AI service.
 * Falls back to direct Gemini if Flask is unreachable.
 */
const generateQuestionBank = async (topic, courseName, notes = null, quizType = 'mcq') => {
  try {
    logger.info(`[AI] Calling Python service for ${quizType} questions: "${topic}"`);
    const response = await axios.post(`${AI_SERVICE_URL}/api/generate-questions`, {
      topic,
      courseName,
      notes,
      count: 10,
      quizType
    }, { timeout: 60000 });

    if (response.data.success && response.data.questions) {
      logger.success(`[AI] ${quizType} question bank received from Python service for: ${topic}`);
      return response.data.questions;
    }

    logger.warn(`[AI] Python service returned no questions, falling back to direct Gemini`);
    return await fallbackGenerateQuestions(topic, courseName, notes, quizType);

  } catch (error) {
    logger.warn(`[AI] Python service unreachable (${error.message}), falling back to direct Gemini`);
    return await fallbackGenerateQuestions(topic, courseName, notes, quizType);
  }
};

/**
 * Generate a study document — calls Python Flask AI service.
 * Falls back to direct Gemini if Flask is unreachable.
 */
const generateStudyDocument = async (topic, courseName, pageCount = 2, notes = null) => {
  try {
    logger.info(`[AI] Calling Python service for study doc: "${topic}"`);
    const response = await axios.post(`${AI_SERVICE_URL}/api/generate-document`, {
      topic,
      courseName,
      pageCount,
      notes
    }, { timeout: 60000 });

    if (response.data.success && response.data.document) {
      logger.success(`[AI] Study document received from Python service for: ${topic}`);
      return response.data.document;
    }

    logger.warn(`[AI] Python service returned no document, falling back to direct Gemini`);
    return await fallbackGenerateDocument(topic, courseName, pageCount, notes);

  } catch (error) {
    logger.warn(`[AI] Python service unreachable (${error.message}), falling back to direct Gemini`);
    return await fallbackGenerateDocument(topic, courseName, pageCount, notes);
  }
};

// ── Fallback: Direct Gemini from Node.js ──

let genAI = null;
const getGenAI = () => {
  if (!genAI) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const fallbackGenerateQuestions = async (topic, courseName, notes, quizType = 'mcq') => {
  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });

    const formatInstructions = quizType === 'mcq'
      ? `FORMAT — Multiple Choice Questions:
Generate exactly 10 MCQ questions.
Each question must have exactly 4 options:
A) option one
B) option two
C) option three
D) option four
ANSWER: [correct option letter]
EXPLANATION: [why this answer is correct]

Make options plausible but only one correct.`
      : `FORMAT — Descriptive Questions:
Generate exactly 10 descriptive questions.
Each question requires a detailed answer.

For each question provide:
QUESTION: [detailed question]
ANSWER: [comprehensive answer of minimum 5-8 sentences covering all key aspects]
KEY POINTS: [3-4 bullet points summarizing the answer]`;

    const notesContext = notes
      ? `Based on these ACTUAL COURSE NOTES:
===NOTES START===
${notes}
===NOTES END===`
      : `Based on general knowledge (no course notes available):`;

    const prompt = `You are a senior professor preparing ${quizType === 'mcq' ? 'multiple choice' : 'descriptive'} exam questions for engineering students.

${notesContext}

Topic: "${topic}"
Course: "${courseName}"
Quiz Type: ${quizType.toUpperCase()}

${formatInstructions}

Important:
- Questions must be exam level difficulty
- Cover different aspects of the topic
- Be specific not generic
- Number questions as Q1, Q2... Q10`;

    const result = await model.generateContent(prompt);
    logger.success(`[AI-Fallback] ${quizType} question bank generated for: ${topic}`);
    return result.response.text();
  } catch (error) {
    logger.error(`[AI-Fallback] Question generation error: ${error.message}`);
    return null;
  }
};

const fallbackGenerateDocument = async (topic, courseName, pageCount, notes) => {
  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });
    const wordCount = pageCount * 500;

    const prompt = notes
      ? `You are a senior professor creating study material for engineering students.

The following are the ACTUAL COURSE NOTES:

===NOTES START===
${notes}
===NOTES END===

Based on these notes create a comprehensive study document for:
Topic: "${topic}"
Course: "${courseName}"
Length: ${pageCount} pages equivalent (approximately ${wordCount} words)

Structure:
INTRODUCTION
KEY CONCEPTS FROM NOTES
DETAILED EXPLANATION
IMPORTANT DEFINITIONS
REAL WORLD APPLICATIONS
COMMON EXAM QUESTIONS
SUMMARY

Base everything on the provided notes.
Use technical terms from the notes.
Make content academically rigorous.`

      : `You are a senior professor creating study material for engineering students.

Create a comprehensive study document for:
Topic: "${topic}"
Course: "${courseName}"
Length: ${pageCount} pages equivalent (approximately ${wordCount} words)

Structure:
INTRODUCTION
KEY CONCEPTS
DETAILED EXPLANATION
IMPORTANT DEFINITIONS
REAL WORLD APPLICATIONS
COMMON EXAM QUESTIONS
SUMMARY

Make content academically rigorous. Use proper technical terminology.
Write at engineering student level.
Note: Generated from general knowledge as no course notes were available.`;

    const result = await model.generateContent(prompt);
    logger.success(`[AI-Fallback] Study document generated for: ${topic}`);
    return result.response.text();
  } catch (error) {
    logger.error(`[AI-Fallback] Document generation error: ${error.message}`);
    return null;
  }
};

module.exports = {
  generateQuestionBank,
  generateStudyDocument
};