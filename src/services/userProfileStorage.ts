import AsyncStorage from '@react-native-async-storage/async-storage/lib/commonjs/index';

import type { UserProfile } from '../models/userProfile';

const USER_PROFILE_STORAGE_KEY = 'inqoura/user-profile/v1';

type StoredProfilesMap = Record<string, UserProfile>;

async function loadAllProfiles(): Promise<StoredProfilesMap> {
  const rawValue = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as StoredProfilesMap;
  } catch {
    return {};
  }
}

async function writeAllProfiles(profiles: StoredProfilesMap) {
  await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profiles));
}

export async function loadStoredUserProfile(uid: string) {
  const profiles = await loadAllProfiles();
  return profiles[uid] ?? null;
}

export async function saveStoredUserProfile(profile: UserProfile) {
  const profiles = await loadAllProfiles();
  profiles[profile.uid] = profile;
  await writeAllProfiles(profiles);
  return profile;
}

export async function clearStoredUserProfile(uid: string) {
  const profiles = await loadAllProfiles();
  delete profiles[uid];
  await writeAllProfiles(profiles);
}
