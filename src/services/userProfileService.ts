import { updateProfile } from 'firebase/auth';

import { getAuthSession } from '../store';
import type { UserProfile } from '../models/userProfile';
import { getFirebaseAuth } from './firebaseAuth';
import {
  clearStoredUserProfile,
  loadStoredUserProfile,
  saveStoredUserProfile,
} from './userProfileStorage';
import { loadRemoteUserProfile, saveRemoteUserProfile } from './cloudUserDataService';

function buildDefaultProfile(): UserProfile | null {
  const authUser = getAuthSession().user;

  if (!authUser) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    age: null,
    countryCode: null,
    createdAt: authUser.createdAt || now,
    email: authUser.email,
    name: authUser.displayName ?? '',
    plan: 'free',
    role: 'user',
    uid: authUser.id,
    updatedAt: authUser.updatedAt || now,
  };
}

export async function loadUserProfile() {
  const defaultProfile = buildDefaultProfile();

  if (!defaultProfile) {
    return null;
  }

  const [localProfile, remoteProfile] = await Promise.all([
    loadStoredUserProfile(defaultProfile.uid),
    loadRemoteUserProfile(defaultProfile.uid),
  ]);

  const mergedProfile = {
    ...defaultProfile,
    ...(localProfile ?? {}),
    ...(remoteProfile ?? {}),
    email: defaultProfile.email,
    uid: defaultProfile.uid,
  };

  await saveStoredUserProfile(mergedProfile);
  return mergedProfile;
}

export async function saveUserProfile(
  input: Pick<UserProfile, 'age' | 'countryCode' | 'name'>
) {
  const currentProfile = await loadUserProfile();

  if (!currentProfile) {
    return null;
  }

  const nextProfile: UserProfile = {
    ...currentProfile,
    age: input.age,
    countryCode: input.countryCode,
    name: input.name.trim(),
    updatedAt: new Date().toISOString(),
  };

  await saveStoredUserProfile(nextProfile);
  await saveRemoteUserProfile(nextProfile);

  const auth = getFirebaseAuth();
  if (auth.currentUser && nextProfile.name !== auth.currentUser.displayName) {
    await updateProfile(auth.currentUser, {
      displayName: nextProfile.name || null,
    }).catch(() => {
      // The profile document is still stored even if auth profile update fails.
    });
  }

  return nextProfile;
}

export async function clearUserProfile(uid: string) {
  await clearStoredUserProfile(uid);
}
