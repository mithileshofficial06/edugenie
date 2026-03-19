const axios = require('axios');
const logger = require('../utils/logger');

const getMoodleCourses = async (token, moodleUrl) => {
  try {
    const response = await axios.get(`${moodleUrl}/webservice/rest/server.php`, {
      params: {
        wstoken: token,
        wsfunction: 'core_enrol_get_users_courses',
        moodlewsrestformat: 'json',
        userid: await getMoodleUserId(token, moodleUrl)
      }
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
      }
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
    const response = await axios.get(`${moodleUrl}/webservice/rest/server.php`, { params });
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
    const response = await axios.get(`${moodleUrl}/webservice/rest/server.php`, { params });
    logger.info(`Fetched quizzes from Moodle`);
    return response.data.quizzes || [];
  } catch (error) {
    logger.error(`Error fetching quizzes: ${error.message}`);
    return [];
  }
};

module.exports = {
  getMoodleCourses,
  getMoodleAssignments,
  getMoodleQuizzes
};