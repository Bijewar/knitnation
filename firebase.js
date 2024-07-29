import { initializeApp, getApps } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';
   import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

   import { getStorage } from 'firebase/storage';

   const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.asia-southeast1.firebasedatabase.app`,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
   

   let app;
   if (!getApps().length) {
     app = initializeApp(firebaseConfig);
   } else {
     app = getApps()[0];
   }

   const auth = getAuth(app);
   const db = getFirestore(app);
   const storage = getStorage(app);

   export { auth, db, storage };