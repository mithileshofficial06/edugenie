const logger = require('./logger');

/**
 * Retry a function with exponential backoff.
 * 
 * @param {Function} fn - Async function to retry
 * @param {Object} opts - Options
 * @param {number} opts.retries - Max retry attempts (default: 3)
 * @param {number} opts.baseDelay - Base delay in ms (default: 2000)
 * @param {string} opts.label - Label for logging
 * @returns {*} Result of the function call
 */
const withRetry = async (fn, { retries = 3, baseDelay = 2000, label = 'operation' } = {}) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      if (attempt === retries) {
        logger.error(`[Retry] ${label} failed after ${retries} attempts: ${error.message}`);
        throw error;
      }

      const delay = baseDelay * attempt; // 2s, 4s, 6s
      logger.warn(`[Retry] ${label} attempt ${attempt}/${retries} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = { withRetry };
