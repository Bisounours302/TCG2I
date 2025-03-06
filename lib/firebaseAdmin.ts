import admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`,
    });

    adminDb = admin.firestore(app);
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw error;
  }
} else {
  adminDb = admin.firestore();
}

export { adminDb };
