import * as admin from 'firebase-admin';

// Function to initialize Firebase Admin
function initializeFirebaseAdmin() {
  // Check if already initialized
  if (admin.apps.length > 0) {
    return {
      auth: admin.auth(),
      firestore: admin.firestore()
    };
  }

  // Check for required environment variables
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || 
      !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 
      !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    console.error('Missing Firebase Admin environment variables');
    
    // For development only - fallback to a default credential if available
    // Remove this in production
    if (process.env.NODE_ENV === 'development') {
      try {
        // Try to initialize with application default credentials
        admin.initializeApp();
        console.warn('Using default credentials. This should only happen in development.');
      } catch (error) {
        console.error('Failed to initialize with default credentials:', error);
      }
    }
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
    }
  }

  return {
    auth: admin.auth(),
    firestore: admin.firestore()
  };
}

const firebaseAdmin = initializeFirebaseAdmin();

export const adminAuth = firebaseAdmin.auth;
export const adminFirestore = firebaseAdmin.firestore;
