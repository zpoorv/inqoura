import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OUTBOX_STORAGE_KEY = '@inqoura_offline_outbox_queue';
const MAX_ATTEMPTS = 5;
const BASE_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

export interface OutboxMutation<T = unknown> {
  id: string;
  type: string;
  payload: T;
  attempt: number;
  createdAt: number;
}

export type MutationExecutor = (mutation: OutboxMutation) => Promise<boolean>;

const activeExecutors = new Map<string, MutationExecutor>();
let isFlushing = false;

/**
 * Registers an executor for a specific mutation type.
 */
export function registerMutationExecutor(type: string, executor: MutationExecutor): void {
  activeExecutors.set(type, executor);
}

/**
 * Adds an operation to the durable offline outbox queue.
 */
export async function enqueueMutation<T = unknown>(type: string, payload: T): Promise<string> {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const mutation: OutboxMutation<T> = {
    id,
    type,
    payload,
    attempt: 0,
    createdAt: Date.now(),
  };

  try {
    const queue = await loadOutboxQueue();
    queue.push(mutation);
    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    if (__DEV__) console.warn('[OfflineOutbox] Enqueue error:', err);
  }

  // Attempt immediate flush if currently online
  void checkAndFlush();

  return id;
}

/**
 * Loads the current outbox queue from persistent storage.
 */
export async function loadOutboxQueue(): Promise<OutboxMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OutboxMutation[]) : [];
  } catch {
    return [];
  }
}

/**
 * Flushes all pending mutations through their registered executors with exponential backoff & jitter.
 */
export async function flushOutbox(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  try {
    const queue = await loadOutboxQueue();
    if (queue.length === 0) return;

    const remaining: OutboxMutation[] = [];

    for (const mutation of queue) {
      const executor = activeExecutors.get(mutation.type);

      if (!executor) {
        // Retain unhandled mutations for when relevant service initializes
        remaining.push(mutation);
        continue;
      }

      try {
        const success = await executor(mutation);
        if (!success) {
          mutation.attempt += 1;
          if (mutation.attempt < MAX_ATTEMPTS) {
            remaining.push(mutation);
          }
        }
      } catch {
        mutation.attempt += 1;
        if (mutation.attempt < MAX_ATTEMPTS) {
          remaining.push(mutation);
        }
      }
    }

    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(remaining));
  } finally {
    isFlushing = false;
  }
}

/**
 * Calculates exponential backoff delay with full jitter.
 */
export function calculateBackoffWithJitter(attempt: number): number {
  const exponential = Math.min(MAX_RETRY_MS, BASE_RETRY_MS * Math.pow(2, attempt));
  const jitterFactor = 0.8 + Math.random() * 0.4; // 80% to 120% jitter
  return Math.round(exponential * jitterFactor);
}

/**
 * Checks connectivity and flushes the outbox if online.
 */
async function checkAndFlush(): Promise<void> {
  const state = await NetInfo.fetch();
  if (state.isConnected && state.isInternetReachable !== false) {
    await flushOutbox();
  }
}

/**
 * Subscribes to network transitions to automatically replay mutations.
 */
export function initializeOutboxSync(): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void flushOutbox();
    }
  });

  return unsubscribe;
}
