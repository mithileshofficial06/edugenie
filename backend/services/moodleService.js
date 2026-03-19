const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Validate Moodle token before running the pipeline
 */
const validateMoodleToken = async (token, moodleUrl) => {
  try {
    const response = await axios.get(`${moodleUrl}/webservice/rest/server.php`, {
      params: {
        wstoken: token,
        wsfunction: 'core_webservice_get_site_info',
        moodlewsrestformat: 'json'
      },
      timeout: 10000
    });

    if (response.data.errorcode) {
      logger.error(`Invalid Moodle token: ${response.data.errorcode}`);
      return { valid: false, error: response.data.errorcode };
    }

    return {
      valid: true,
      userId: response.data.userid,
      siteName: response.data.sitename
    };
  } catch (error) {
    logger.error(`Moodle unreachable: ${error.message}`);
    return { valid: false, error: 'Moodle server unreachable' };
  }
};

const getMoodleCourses = async (token, moodleUrl) => {
  try {
    const response = await axios.get(`${moodleUrl}/webservice/rest/server.php`, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_users_courses',
        moodlewsrestformat: 'json',
        userid: await getMoodleUserId(token, moodleUrl)
      },
      timeout: 10000
    });
    logger.info(`Fetched ${response.data.length} courses`);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching courses: ${error.message}`);
    return [];
  }
};

const getMoodleUserId = async (token, moodleUrl) => {
  try {
    const response = await axios.get(`${moodleUrl}/webservice/rest/server.php`, {
      params: {
        wstoken: token,
        wsfunction: 'core_webservice_get_site_info',
        moodlewsrestformat: 'json'
      },
      timeout: 10000
    });
    return response.data.userid;
  } catch (error) {
    logger.error(`Error fetching user ID: ${error.message}`);
    return null;
  }
};

const getMoodleAssignments = async (token, moodleUrl, courseIds) => {
  try {
    const params = {
      wstoken: token,
      wsfunction: 'mod_assign_get_assignments',
      moodlewsrestformat: 'json'
    };
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    const response = await axios.get(`${moodleUrl}/webservice/rest/server.php`, { params, timeout: 10000 });
    logger.info(`Fetched assignments from Moodle`);
    return response.data.courses || [];
  } catch (error) {
    logger.error(`Error fetching assignments: ${error.message}`);
    return [];
  }
};

const getMoodleQuizzes = async (token, moodleUrl, courseIds) => {
  try {
    const params = {
      wstoken: token,
      wsfunction: 'mod_quiz_get_quizzes_by_courses',
      moodlewsrestformat: 'json'
    };
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    const response = await axios.get(`${moodleUrl}/webservice/rest/server.php`, { params, timeout: 10000 });
    logger.info(`Fetched quizzes from Moodle`);
    return response.data.quizzes || [];
  } catch (error) {
    logger.error(`Error fetching quizzes: ${error.message}`);
    return [];
  }
};

/**
 * Fetch resources/notes from Moodle using mod_resource_get_resources_by_courses
 */
const getMoodleResources = async (token, moodleUrl, courseIds) => {
  try {
    const params = {
      wstoken: token,
      wsfunction: 'mod_resource_get_resources_by_courses',
      moodlewsrestformat: 'json'
    };
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    const response = await axios.get(`${moodleUrl}/webservice/rest/server.php`, { params, timeout: 10000 });
    logger.info(`Fetched resources from Moodle`);
    return response.data.resources || [];
  } catch (error) {
    logger.error(`Error fetching resources: ${error.message}`);
    return [];
  }
};

module.exports = {
  getMoodleCourses,
  getMoodleAssignments,
  getMoodleQuizzes,
  getMoodleResources,
  validateMoodleToken
};