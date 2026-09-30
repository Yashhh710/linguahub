const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const list = value => String(value || '').split(',').map(s => s.trim()).filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3001,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: list(process.env.CORS_ORIGIN),
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    models: list(process.env.GROQ_MODELS).length ? list(process.env.GROQ_MODELS) : ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'openai/gpt-oss-20b']
  },
  firebaseAdmin: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  },
  // Public values for the browser SDK. Safe to expose; they are not secrets.
  firebaseWeb: {
    apiKey: process.env.FIREBASE_WEB_API_KEY,
    authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_WEB_APP_ID,
    messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID,
    vapidKey: process.env.FIREBASE_WEB_VAPID_KEY
  }
};

/** Fail fast with a readable message instead of a cryptic crash later. */
function assertConfig() {
  const problems = [];
  if (!env.mongoUri) problems.push('MONGODB_URI is not set.');
  else if (!/^mongodb(\+srv)?:\/\//.test(env.mongoUri)) problems.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  if (!env.jwtSecret) problems.push('JWT_SECRET is not set.');
  else if (env.jwtSecret.length < 16) problems.push('JWT_SECRET must be at least 16 characters (32+ recommended).');
  if (problems.length) throw new Error(`Configuration error:\n - ${problems.join('\n - ')}\nCopy .env.example to .env and fill it in.`);
}

module.exports = { env, assertConfig };
