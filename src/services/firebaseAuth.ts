import { getAuth } from 'firebase/auth';

import { getFirebaseAppInstance } from './firebaseApp';

export function getFirebaseAuth() {
  return getAuth(getFirebaseAppInstance());
}
