/**
 * Cleanup script — deletes old student records and their assignments
 * so you can re-register fresh with the new semester fields.
 * 
 * Run: node cleanup.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const studentCount = await mongoose.connection.db.collection('students').countDocuments();
    const assignmentCount = await mongoose.connection.db.collection('assignments').countDocuments();
    
    console.log(`Found ${studentCount} student(s) and ${assignmentCount} assignment(s)`);
    console.log('Deleting all records...');

    const studentResult = await mongoose.connection.db.collection('students').deleteMany({});
    const assignmentResult = await mongoose.connection.db.collection('assignments').deleteMany({});

    console.log(`Deleted ${studentResult.deletedCount} student(s)`);
    console.log(`Deleted ${assignmentResult.deletedCount} assignment(s)`);
    console.log('Database cleaned! You can now re-register from the frontend.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanup();
