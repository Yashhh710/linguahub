const mongoose = require('mongoose');
const { env } = require('./env');

const redact = text => String(text).replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/gi, 'mongodb://[REDACTED]@');

async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${redact(error.message)}\nCheck MONGODB_URI, the database user's permissions, and Atlas Network Access (IP allow-list).`);
  }
  console.log(`MongoDB connected (${mongoose.connection.name})`);
}

module.exports = connectDB;
