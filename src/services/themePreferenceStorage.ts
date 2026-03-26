import AsyncStorage from '@react-native-async-storage/async-storage/lib/commonjs/index';

import type { AppearanceMode } from '../models/preferences';

const APPEARANCE_MODE_STORAGE_KEY = 'inqoura/appearance-mode/v1';

export async function loadAppearanceMode(): Promise<AppearanceMode> {
  const rawValue = await AsyncStorage.getItem(APPEARANCE_MODE_STORAGE_KEY);
  return rawValue === 'dark' ? 'dark' : 'light';
}

export async function saveAppearanceMode(mode: AppearanceMode) {
  await AsyncStorage.setItem(APPEARANCE_MODE_STORAGE_KEY, mode);
  return mode;
}

export async function clearAppearanceMode() {
  await AsyncStorage.removeItem(APPEARANCE_MODE_STORAGE_KEY);
}
