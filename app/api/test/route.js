// firebaseAdminTest.js
const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privatekey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')  // Correct
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
    }
  }
}

function testFirebaseAdmin() {
  initializeFirebaseAdmin();
  
  const auth = admin.auth();
  auth.listUsers(1)
    .then((listUsersResult) => {
      console.log('Firebase Admin is working. First user:', listUsersResult.users[0].toJSON());
    })
    .catch((error) => {
      console.error('Error listing users:', error);
    });
}

testFirebaseAdmin();