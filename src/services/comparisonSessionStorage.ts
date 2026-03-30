import AsyncStorage from '@react-native-async-storage/async-storage/lib/commonjs/index';

import type {
  ComparisonSession,
  ComparisonSessionEntry,
} from '../models/comparisonSession';
import { getAuthSession } from '../store';

const STORAGE_KEY_PREFIX = 'inqoura/shelf-session/v1';
const MAX_SESSION_ENTRIES = 4;

function getScopeId() {
  const sessionUser = getAuthSession().user;
  return sessionUser ? `user:${sessionUser.id}` : 'guest';
}

function getStorageKey() {
  return `${STORAGE_KEY_PREFIX}/${getScopeId()}`;
}

function isValidEntry(value: unknown): value is ComparisonSessionEntry {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as ComparisonSessionEntry).barcode === 'string' &&
      typeof (value as ComparisonSessionEntry).addedAt === 'string' &&
      (value as ComparisonSessionEntry).product
  );
}

function sortEntries(entries: ComparisonSessionEntry[]) {
  return [...entries].sort(
    (left, right) =>
      new Date(right.addedAt).getTime() - new Date(left.addedAt).getTime()
  );
}

async function writeEntries(entries: ComparisonSessionEntry[]) {
  const nextSession: ComparisonSession = {
    entries: sortEntries(entries).slice(0, MAX_SESSION_ENTRIES),
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(getStorageKey(), JSON.stringify(nextSession));
  return nextSession;
}

export async function loadComparisonSession(): Promise<ComparisonSession> {
  try {
    const rawValue = await AsyncStorage.getItem(getStorageKey());

    if (!rawValue) {
      return { entries: [], updatedAt: null };
    }

    const parsedValue = JSON.parse(rawValue) as Partial<ComparisonSession>;
    const entries = Array.isArray(parsedValue.entries)
      ? parsedValue.entries.filter(isValidEntry)
      : [];

    return {
      entries: sortEntries(entries),
      updatedAt: typeof parsedValue.updatedAt === 'string' ? parsedValue.updatedAt : null,
    };
  } catch {
    return { entries: [], updatedAt: null };
  }
}

export async function upsertComparisonSessionEntry(
  entry: ComparisonSessionEntry
) {
  const currentSession = await loadComparisonSession();
  const nextEntries = currentSession.entries.filter(
    (item) => item.barcode !== entry.barcode
  );
  nextEntries.unshift(entry);
  return writeEntries(nextEntries);
}

export async function removeComparisonSessionEntry(barcode: string) {
  const currentSession = await loadComparisonSession();
  return writeEntries(
    currentSession.entries.filter((entry) => entry.barcode !== barcode)
  );
}

export async function clearComparisonSession() {
  await AsyncStorage.removeItem(getStorageKey());
  return { entries: [], updatedAt: null } satisfies ComparisonSession;
}
