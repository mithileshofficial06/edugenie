const axios = require('axios');
const pdfParse = require('pdf-parse');
const logger = require('../utils/logger');

/**
 * Extract text from a Moodle file (PDF or text) by downloading it.
 */
const extractTextFromMoodleFile = async (fileUrl, token) => {
  try {
    const response = await axios.get(fileUrl, {
      params: { token },
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 10 * 1024 * 1024 // 10MB max
    });

    const contentType = response.headers['content-type'] || '';

    // Handle PDF files
    if (contentType.includes('pdf') || fileUrl.toLowerCase().includes('.pdf')) {
      const pdfData = await pdfParse(Buffer.from(response.data));
      const text = pdfData.text.replace(/\s+/g, ' ').trim().substring(0, 8000);
      logger.success(`Extracted ${text.length} chars from PDF`);
      return text;
    }

    // Handle text files
    if (contentType.includes('text') || fileUrl.toLowerCase().includes('.txt')) {
      return Buffer.from(response.data).toString('utf-8').substring(0, 8000);
    }

    // Unsupported file type
    logger.warn(`Unsupported file type: ${contentType}`);
    return null;

  } catch (error) {
    logger.error(`PDF extraction failed: ${error.message}`);
    return null;
  }
};

const extractTextFromResource = async (resourceUrl, token) => {
  return extractTextFromMoodleFile(resourceUrl, token);
};

module.exports = {
  extractTextFromMoodleFile,
  extractTextFromResource
};
