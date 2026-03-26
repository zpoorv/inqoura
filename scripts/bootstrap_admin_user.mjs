import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '';
const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '';
const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!apiKey || !projectId || !email || !password) {
  throw new Error('Missing required environment variables for admin bootstrap.');
}

const app = initializeApp({
  apiKey,
  appId,
  authDomain,
  messagingSenderId,
  projectId,
  storageBucket,
});

const auth = getAuth(app);
const db = getFirestore(app);

async function authenticate() {
  let credentials;

  try {
    credentials = await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'auth/email-already-in-use'
    ) {
      credentials = await signInWithEmailAndPassword(auth, email, password);
    } else {
      throw error;
    }
  }

  await updateProfile(credentials.user, { displayName: 'admin' });
  return credentials.user.uid;
}

function buildFields(uid) {
  const now = new Date().toISOString();

  return {
    age: { nullValue: null },
    countryCode: { nullValue: null },
    createdAt: { stringValue: now },
    email: { stringValue: email },
    name: { stringValue: 'admin' },
    plan: { stringValue: 'premium' },
    role: { stringValue: 'admin' },
    uid: { stringValue: uid },
    updatedAt: { stringValue: now },
  };
}

async function writeUserProfile(uid) {
  const now = new Date().toISOString();

  await setDoc(doc(db, 'users', uid), {
    age: null,
    countryCode: null,
    createdAt: now,
    email,
    name: 'admin',
    plan: 'premium',
    role: 'admin',
    uid,
    updatedAt: now,
  });
}

const localId = await authenticate();
await writeUserProfile(localId);

console.log(
  JSON.stringify(
    {
      displayName: 'admin',
      email,
      plan: 'premium',
      role: 'admin',
      uid: localId,
    },
    null,
    2
  )
);
