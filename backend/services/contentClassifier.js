const logger = require('../utils/logger');

/**
 * Classify Moodle content as quiz, assignment, or notes
 * based on keyword matching in title and description.
 */
const classifyContent = (title, description = '') => {
  const text = `${title} ${description}`.toLowerCase();

  const quizKeywords = ['quiz', 'test', 'exam', 'mcq', 'multiple choice', 'objective', 'online test'];
  const notesKeywords = ['notes', 'material', 'resource', 'reading', 'lecture notes', 'slides', 'ppt', 'pdf'];

  if (quizKeywords.some(kw => text.includes(kw))) {
    return 'quiz';
  }

  if (notesKeywords.some(kw => text.includes(kw))) {
    return 'notes';
  }

  return 'assignment';
};

/**
 * Extract page count hints from assignment description.
 * Looks for patterns like "2 pages", "5-page", etc.
 * Defaults to 2 if no pattern is found.
 */
const extractPageCount = (description = '') => {
  if (!description) return 2;

  const text = description.toLowerCase();

  // Match patterns like "2 pages", "5-page", "10 page"
  const match = text.match(/(\d+)\s*[-]?\s*page/);
  if (match) {
    const count = parseInt(match[1], 10);
    return count > 0 && count <= 50 ? count : 2;
  }

  // Match word count hints and convert to approximate pages
  const wordMatch = text.match(/(\d+)\s*words?/);
  if (wordMatch) {
    const words = parseInt(wordMatch[1], 10);
    return Math.max(1, Math.ceil(words / 500));
  }

  return 2;
};

module.exports = { classifyContent, extractPageCount };
