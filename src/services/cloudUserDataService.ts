import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import type { ScanHistoryEntry } from './scanHistoryStorage';
import { getFirebaseAppInstance } from './firebaseApp';
import type { GamificationProfile } from '../models/gamification';
import type { UserProfile } from '../models/userProfile';

function getDb() {
  return getFirestore(getFirebaseAppInstance());
}

function getUserDocRef(uid: string) {
  return doc(getDb(), 'users', uid);
}

function getHistoryCollectionRef(uid: string) {
  return collection(getDb(), 'users', uid, 'scanHistory');
}

export async function loadRemoteUserProfile(uid: string) {
  try {
    const snapshot = await getDoc(getUserDocRef(uid));
    return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function saveRemoteUserProfile(profile: UserProfile) {
  try {
    await setDoc(getUserDocRef(profile.uid), profile, { merge: true });
  } catch {
    // Firestore sync is best-effort. Premium and admin access are verified separately.
  }
}

export async function loadRemoteGamificationProfile(uid: string) {
  try {
    const snapshot = await getDoc(getUserDocRef(uid));

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as UserProfile & {
      gamificationProfile?: GamificationProfile | null;
    };

    return data.gamificationProfile ?? null;
  } catch {
    return null;
  }
}

export async function saveRemoteGamificationProfile(
  uid: string,
  gamificationProfile: GamificationProfile
) {
  try {
    await setDoc(
      getUserDocRef(uid),
      { gamificationProfile },
      { merge: true }
    );
  } catch {
    // Best-effort sync only. Local progress remains the source of experience.
  }
}

export async function loadRemoteScanHistory(uid: string) {
  try {
    const snapshot = await getDocs(getHistoryCollectionRef(uid));
    return snapshot.docs.map((item) => item.data() as ScanHistoryEntry);
  } catch {
    return [];
  }
}

export async function saveRemoteScanHistoryEntry(uid: string, entry: ScanHistoryEntry) {
  try {
    await setDoc(doc(getHistoryCollectionRef(uid), entry.id), entry, { merge: true });
  } catch {
    // Remote history is best-effort and should not block the on-device experience.
  }
}

const FIRESTORE_BATCH_LIMIT = 400;

async function commitInChunks<T>(
  items: T[],
  addToBatch: (batch: ReturnType<typeof writeBatch>, item: T) => void
) {
  for (let index = 0; index < items.length; index += FIRESTORE_BATCH_LIMIT) {
    const chunk = items.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(getDb());
    chunk.forEach((item) => addToBatch(batch, item));
    await batch.commit();
  }
}

export async function deleteRemoteScanHistoryEntries(uid: string, ids: string[]) {
  try {
    await commitInChunks(ids, (batch, id) => {
      batch.delete(doc(getHistoryCollectionRef(uid), id));
    });
  } catch {
    // Ignore remote cleanup failures and preserve local behavior.
  }
}

export async function replaceRemoteScanHistory(uid: string, entries: ScanHistoryEntry[]) {
  try {
    const existingEntries = await getDocs(getHistoryCollectionRef(uid));

    await commitInChunks(existingEntries.docs, (batch, docSnap) => {
      batch.delete(docSnap.ref);
    });

    await commitInChunks(entries, (batch, entry) => {
      batch.set(doc(getHistoryCollectionRef(uid), entry.id), entry);
    });
  } catch {
    // Sync remains optional while Firestore is being rolled out.
  }
}

export async function deleteRemoteUserData(uid: string) {
  const historyDocs = await getDocs(getHistoryCollectionRef(uid));

  await commitInChunks(historyDocs.docs, (batch, docSnap) => {
    batch.delete(docSnap.ref);
  });

  const finalBatch = writeBatch(getDb());
  finalBatch.delete(getUserDocRef(uid));
  await finalBatch.commit();
}
