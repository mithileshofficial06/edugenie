require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.messages.create({
  from: 'whatsapp:+14155238886',
  to: 'whatsapp:+916380409380',
  body: '🧞 EduGenie test message — WhatsApp is working!'
})
.then(m => console.log('Sent! SID:', m.sid))
.catch(e => console.error('Error:', e.message));