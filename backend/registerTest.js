require('dotenv').config();
const axios = require('axios');

const testRegister = async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/register', {
      moodleToken: 'ef4751a2a5c33c21457e35497f40a074',
      whatsappNumber: '+916380409380',
      moodleUrl: 'https://moodle.licet.ac.in'
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testRegister();