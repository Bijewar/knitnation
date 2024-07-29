import { getAuth } from 'firebase-admin/auth';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';

const firebaseAdminConfig = {
  credential: applicationDefault(),
  // Optionally add other Firebase Admin SDK configurations here if needed
};

// Initialize Firebase Admin SDK
const app = initializeApp(firebaseAdminConfig);

export default async function handler(req, res) {
  try {
    // Ensure the request is authenticated
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the ID token
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    const ownerId = decodedToken.uid;

    if (ownerId !== process.env.NEXT_PUBLIC_OWNER_UID) { // Use environment variable
      return res.status(403).json({ error: 'Forbidden. Only the owner can add products.' });
    }

    res.status(200).json({ message: 'Authorized' });
  } catch (error) {
    console.error('Error in checkOwnership API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
