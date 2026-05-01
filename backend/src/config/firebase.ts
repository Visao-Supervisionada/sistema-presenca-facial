import admin from 'firebase-admin';

const caminhoCredencial = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!caminhoCredencial) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS não foi definida no .env');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const db = admin.firestore();
export const timestampServidor = admin.firestore.FieldValue.serverTimestamp;