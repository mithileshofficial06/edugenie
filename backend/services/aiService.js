const axios = require('axios');
const logger = require('../utils/logger');

// Python AI microservice URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

/**
 * Generate a mock question bank — calls Python Flask AI service.
 * Falls back to direct Gemini if Flask is unreachable.
 */
const generateQuestionBank = async (topic, courseName, notes = null) => {
  try {
    logger.info(`[AI] Calling Python service for questions: "${topic}"`);
    const response = await axios.post(`${AI_SERVICE_URL}/api/generate-questions`, {
      topic,
      courseName,
      notes,
      count: 10
    }, { timeout: 60000 });

    if (response.data.success && response.data.questions) {
      logger.success(`[AI] Question bank received from Python service for: ${topic}`);
      return response.data.questions;
    }

    logger.warn(`[AI] Python service returned no questions, falling back to direct Gemini`);
    return await fallbackGenerateQuestions(topic, courseName, notes);

  } catch (error) {
    logger.warn(`[AI] Python service unreachable (${error.message}), falling back to direct Gemini`);
    return await fallbackGenerateQuestions(topic, courseName, notes);
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

const fallbackGenerateQuestions = async (topic, courseName, notes) => {
  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = notes
      ? `You are a senior academic professor preparing exam questions for engineering students. Based on these notes:\n"${notes}"\n\nGenerate exactly 10 high quality exam questions with detailed answers for:\nTopic: "${topic}"\nCourse: "${courseName}"\n\nRequirements:\n- Mix of definition, concept, and application based questions\n- Each answer must be 3-5 sentences minimum\n- Questions must be exam level difficulty\n- Include both theory and practical questions\n- Number each question clearly as Q1, Q2 etc\n- Mark each answer clearly as A1, A2 etc\n- Make questions specific to the topic\n- Avoid generic or vague questions`
      : `You are a senior academic professor preparing exam questions for engineering students.\n\nGenerate exactly 10 high quality exam questions with detailed answers for:\nTopic: "${topic}"\nCourse: "${courseName}"\n\nRequirements:\n- Mix of definition, concept, and application based questions\n- Each answer must be 3-5 sentences minimum\n- Questions must be exam level difficulty\n- Include both theory and practical questions\n- Number each question clearly as Q1, Q2 etc\n- Mark each answer clearly as A1, A2 etc\n- Make questions specific to the topic\n- Avoid generic or vague questions\n\nNote: These are AI generated — student should verify with professor.`;

    const result = await model.generateContent(prompt);
    logger.success(`[AI-Fallback] Question bank generated for: ${topic}`);
    return result.response.text();
  } catch (error) {
    logger.error(`[AI-Fallback] Question generation error: ${error.message}`);
    return null;
  }
};

const fallbackGenerateDocument = async (topic, courseName, pageCount, notes) => {
  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const wordCount = pageCount * 500;
    const prompt = notes
      ? `You are a senior academic professor creating study material for engineering students. Based on these notes:\n"${notes}"\n\nCreate a comprehensive study document for:\nTopic: "${topic}"\nCourse: "${courseName}"\nLength: approximately ${wordCount} words (${pageCount} pages)\n\nStructure the document exactly as:\n\nINTRODUCTION\n[2-3 paragraphs introducing the topic]\n\nKEY CONCEPTS\n[List and explain 5-7 main concepts]\n\nDETAILED EXPLANATION\n[In-depth coverage of all important aspects]\n\nIMPORTANT DEFINITIONS\n[List all technical terms with definitions]\n\nREAL WORLD APPLICATIONS\n[How this topic is used in real world]\n\nCOMMON EXAM QUESTIONS\n[5 frequently asked exam questions on this topic]\n\nSUMMARY\n[Brief recap of entire topic in 1 paragraph]\n\nMake content academically rigorous. Use proper technical terminology. Write at engineering student level.`
      : `You are a senior academic professor creating study material for engineering students.\n\nCreate a comprehensive study document for:\nTopic: "${topic}"\nCourse: "${courseName}"\nLength: approximately ${wordCount} words (${pageCount} pages)\n\nStructure the document exactly as:\n\nINTRODUCTION\n[2-3 paragraphs introducing the topic]\n\nKEY CONCEPTS\n[List and explain 5-7 main concepts]\n\nDETAILED EXPLANATION\n[In-depth coverage of all important aspects]\n\nIMPORTANT DEFINITIONS\n[List all technical terms with definitions]\n\nREAL WORLD APPLICATIONS\n[How this topic is used in real world]\n\nCOMMON EXAM QUESTIONS\n[5 frequently asked exam questions on this topic]\n\nSUMMARY\n[Brief recap of entire topic in 1 paragraph]\n\nMake content academically rigorous. Use proper technical terminology. Write at engineering student level.\nNote: AI generated content — verify with professor.`;

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