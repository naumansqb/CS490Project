import admin from "firebase-admin";

let firebaseAdmin: admin.app.App;

export const initializeFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        };

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return firebaseAdmin;
};

export const getAuth = () => {
  if (!firebaseAdmin) {
    initializeFirebaseAdmin();
  }
  return admin.auth();
};

export default { initializeFirebaseAdmin, getAuth };
