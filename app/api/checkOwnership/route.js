import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import serviceAccount from '../../../knitnation/admin.json';

const ALLOWED_UID = 'aqyiudsT06S3dXRiKfwWPYV1T5E3'; // Replace with the UID you want to grant access

const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    return initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
  }
  return getApps()[0];
};

initializeFirebaseAdmin();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (uid !== ALLOWED_UID) {
      return res.status(403).json({ error: 'Forbidden. Only the specified user can access this resource.' });
    }

    res.status(200).json({ message: 'Authorized' });
  } catch (error) {
    console.error('Error in checkOwner API:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
