const path = require('path');
const fs = require('fs');
const { env } = require('../config/env');

let admin = null;
let ready = false;

function init() {
  if (admin) return;
  admin = require('firebase-admin');
  try {
    const serviceAccountPath = env.firebaseAdmin.serviceAccountPath
      ? path.resolve(__dirname, '..', '..', env.firebaseAdmin.serviceAccountPath)
      : null;

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
      ready = true;
    } else if (env.firebaseAdmin.projectId && env.firebaseAdmin.clientEmail && env.firebaseAdmin.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebaseAdmin.projectId,
          clientEmail: env.firebaseAdmin.clientEmail,
          privateKey: env.firebaseAdmin.privateKey.replace(/\\n/g, '\n')
        })
      });
      ready = true;
    } else {
      console.warn('Firebase Admin is not configured — push notifications and Google sign-in verification are disabled. Set FIREBASE_SERVICE_ACCOUNT_PATH (or the individual FIREBASE_* vars) in .env to enable them.');
    }
  } catch (error) {
    console.warn('Firebase Admin failed to initialize:', error.message);
  }
}
init();

/** Sends a push notification to one FCM registration token. Silently no-ops if Firebase isn't configured. */
async function sendPush(token, notification, data = {}) {
  if (!ready || !token) return null;
  try {
    return await admin.messaging().send({ token, notification, data });
  } catch (error) {
    console.warn('Push notification failed:', error.message);
    return null;
  }
}

/** Sends the same push to several tokens; returns { successCount, failureCount }. */
async function sendPushToMany(tokens, notification, data = {}) {
  if (!ready || !tokens?.length) return { successCount: 0, failureCount: 0 };
  try {
    const response = await admin.messaging().sendEachForMulticast({ tokens, notification, data });
    return { successCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    console.warn('Multicast push failed:', error.message);
    return { successCount: 0, failureCount: tokens.length };
  }
}

/** Verifies a Firebase ID token from client-side Google sign-in. */
async function verifyIdToken(idToken) {
  if (!ready) throw new Error('Firebase Admin is not configured on the server.');
  return admin.auth().verifyIdToken(idToken);
}

module.exports = { sendPush, sendPushToMany, verifyIdToken, isReady: () => ready };
