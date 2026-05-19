import AsyncStorage from '@react-native-async-storage/async-storage/lib/commonjs/index';

import { getAuthSession } from '../store';

const STORAGE_KEY_PREFIX = 'inqoura/scanner-intro/v1';

function getStorageKey(userId?: string | null) {
  const scopeId = userId || getAuthSession().user?.id || 'signed-out';
  return `${STORAGE_KEY_PREFIX}/${scopeId}`;
}

export async function shouldShowScannerIntro(userId?: string | null) {
  try {
    const rawValue = await AsyncStorage.getItem(getStorageKey(userId));
    return rawValue !== 'seen';
  } catch {
    return true;
  }
}

export async function markScannerIntroSeen(userId?: string | null) {
  await AsyncStorage.setItem(getStorageKey(userId), 'seen');
}
