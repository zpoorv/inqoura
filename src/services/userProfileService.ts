import { updateProfile } from 'firebase/auth';

import {
  DEFAULT_DIET_PROFILE_ID,
  isDietProfileId,
} from '../constants/dietProfiles';
import type { AuthUser } from '../models/auth';
import { isAppearanceMode } from '../models/preferences';
import { getAuthSession } from '../store';
import type { UserProfile } from '../models/userProfile';
import { getFirebaseAuth } from './firebaseAuth';
import {
  clearStoredUserProfile,
  loadStoredUserProfile,
  saveStoredUserProfile,
} from './userProfileStorage';
import { loadRemoteUserProfile, saveRemoteUserProfile } from './cloudUserDataService';

function buildDefaultProfileFromAuthUser(authUser: AuthUser): UserProfile {
  const now = new Date().toISOString();

  return {
    age: null,
    appearanceMode: 'light',
    countryCode: null,
    createdAt: authUser.createdAt || now,
    dietProfileId: DEFAULT_DIET_PROFILE_ID,
    email: authUser.email,
    name: authUser.displayName ?? '',
    plan: 'free',
    role: 'user',
    uid: authUser.id,
    updatedAt: authUser.updatedAt || now,
  };
}

function buildDefaultProfile(): UserProfile | null {
  const authUser = getAuthSession().user;
  return authUser ? buildDefaultProfileFromAuthUser(authUser) : null;
}

function resolveAppearanceModeValue(
  remoteAppearanceMode: string | null | undefined,
  localAppearanceMode: string | null | undefined,
  baseAppearanceMode: UserProfile['appearanceMode']
): UserProfile['appearanceMode'] {
  if (isAppearanceMode(remoteAppearanceMode)) {
    return remoteAppearanceMode;
  }

  if (isAppearanceMode(localAppearanceMode)) {
    return localAppearanceMode;
  }

  return baseAppearanceMode;
}

function resolveDietProfileIdValue(
  remoteDietProfileId: string | null | undefined,
  localDietProfileId: string | null | undefined,
  baseDietProfileId: UserProfile['dietProfileId']
): UserProfile['dietProfileId'] {
  if (typeof remoteDietProfileId === 'string' && isDietProfileId(remoteDietProfileId)) {
    return remoteDietProfileId;
  }

  if (typeof localDietProfileId === 'string' && isDietProfileId(localDietProfileId)) {
    return localDietProfileId;
  }

  return baseDietProfileId;
}

async function resolveUserProfile(baseProfile: UserProfile) {
  const [localProfile, remoteProfile] = await Promise.all([
    loadStoredUserProfile(baseProfile.uid),
    loadRemoteUserProfile(baseProfile.uid),
  ]);
  const remoteAppearanceMode = remoteProfile?.appearanceMode;
  const localAppearanceMode = localProfile?.appearanceMode;
  const remoteDietProfileId = remoteProfile?.dietProfileId;
  const localDietProfileId = localProfile?.dietProfileId;

  return {
    profile: {
      ...baseProfile,
      ...(localProfile ?? {}),
      ...(remoteProfile ?? {}),
      createdAt:
        remoteProfile?.createdAt ??
        localProfile?.createdAt ??
        baseProfile.createdAt,
      appearanceMode: resolveAppearanceModeValue(
        remoteAppearanceMode,
        localAppearanceMode,
        baseProfile.appearanceMode
      ),
      email: baseProfile.email,
      dietProfileId: resolveDietProfileIdValue(
        remoteDietProfileId,
        localDietProfileId,
        baseProfile.dietProfileId
      ),
      plan: remoteProfile?.plan ?? localProfile?.plan ?? baseProfile.plan,
      role: remoteProfile?.role ?? localProfile?.role ?? baseProfile.role,
      uid: baseProfile.uid,
      updatedAt: remoteProfile?.updatedAt ?? localProfile?.updatedAt ?? baseProfile.updatedAt,
    },
    remoteProfile,
  };
}

export async function loadUserProfile() {
  const defaultProfile = buildDefaultProfile();

  if (!defaultProfile) {
    return null;
  }

  const { profile: mergedProfile } = await resolveUserProfile(defaultProfile);

  await saveStoredUserProfile(mergedProfile);
  return mergedProfile;
}

export async function syncCurrentUserProfileToFirestore() {
  const defaultProfile = buildDefaultProfile();

  if (!defaultProfile) {
    return null;
  }

  const { profile: mergedProfile, remoteProfile } = await resolveUserProfile(defaultProfile);
  const syncedProfile: UserProfile = {
    ...mergedProfile,
    // Login is the best time to backfill missing Firestore user docs for admin tools.
    updatedAt: new Date().toISOString(),
  };

  await saveStoredUserProfile(syncedProfile);

  if (!remoteProfile || JSON.stringify(remoteProfile) !== JSON.stringify(syncedProfile)) {
    await saveRemoteUserProfile(syncedProfile);
  }

  return syncedProfile;
}

async function saveUserProfilePatch(
  patch: Partial<
    Pick<
      UserProfile,
      'age' | 'appearanceMode' | 'countryCode' | 'dietProfileId' | 'name'
    >
  >
) {
  const currentProfile =
    (await syncCurrentUserProfileToFirestore()) ?? (await loadUserProfile());

  if (!currentProfile) {
    return null;
  }

  const nextProfile: UserProfile = {
    ...currentProfile,
    ...patch,
    name:
      typeof patch.name === 'string' ? patch.name.trim() : currentProfile.name,
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

export async function saveUserProfile(
  input: Pick<UserProfile, 'age' | 'countryCode' | 'name'>
) {
  return saveUserProfilePatch({
    age: input.age,
    countryCode: input.countryCode,
    name: input.name,
  });
}

export async function saveCurrentUserPreferences(
  input: Pick<UserProfile, 'appearanceMode' | 'dietProfileId'>
) {
  return saveUserProfilePatch({
    appearanceMode: input.appearanceMode,
    dietProfileId: input.dietProfileId,
  });
}

export async function clearUserProfile(uid: string) {
  await clearStoredUserProfile(uid);
}
