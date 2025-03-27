require('dotenv').config();
const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

const serviceAccount = require('./../' + process.env.FIREBASE_CREDENTIALS_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);

module.exports = {
  admin,
  auth: getAuth(firebaseApp),
  db: admin.firestore(),
  messaging: admin.messaging()
};
