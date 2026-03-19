require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startScheduler } = require('./services/scheduler');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/register', require('./routes/register'));
app.use('/api/debug', require('./routes/debug'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🧞 EduGenie Backend is running!' });
});

// Connect MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.success('MongoDB connected!');
    app.listen(process.env.PORT || 3000, () => {
      logger.success(`Server running on port ${process.env.PORT || 3000}`);
      startScheduler();
    });
  })
  .catch(err => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });