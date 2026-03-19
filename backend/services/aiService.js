const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateQuestionBank = async (topic, courseName, notes = null) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = notes
      ? `You are an exam preparation assistant. Based on these notes:
         "${notes}"
         Generate 10 mock questions with answers for topic: "${topic}" in course: "${courseName}".
         Format as numbered list with answers below each question.`
      : `You are an exam preparation assistant.
         Generate 10 mock questions with answers for topic: "${topic}" in course: "${courseName}".
         Format as numbered list with answers below each question.
         Note: These are AI generated — student should verify with professor.`;

    const result = await model.generateContent(prompt);
    logger.success(`Question bank generated for: ${topic}`);
    return result.response.text();
  } catch (error) {
    logger.error(`AI question generation error: ${error.message}`);
    return null;
  }
};

const generateStudyDocument = async (topic, courseName, pageCount = 2, notes = null) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = notes
      ? `You are a study assistant. Based on these notes:
         "${notes}"
         Create a structured study document for: "${topic}" in course: "${courseName}".
         The document should cover ${pageCount} pages worth of content.
         Include: Introduction, Key Concepts, Important Points, Summary.`
      : `You are a study assistant.
         Create a structured study document for: "${topic}" in course: "${courseName}".
         The document should cover ${pageCount} pages worth of content.
         Include: Introduction, Key Concepts, Important Points, Summary.
         Note: AI generated content — verify with professor.`;

    const result = await model.generateContent(prompt);
    logger.success(`Study document generated for: ${topic}`);
    return result.response.text();
  } catch (error) {
    logger.error(`AI document generation error: ${error.message}`);
    return null;
  }
};

module.exports = {
  generateQuestionBank,
  generateStudyDocument
};