import AsyncStorage from '@react-native-async-storage/async-storage';

type MonitoringValue = boolean | number | string | null | undefined;

export type MonitoringMetadata = Record<string, MonitoringValue>;

type MonitoringLevel = 'fatal' | 'nonfatal';

type MonitoringRecord = {
  level: MonitoringLevel;
  message: string;
  metadata: MonitoringMetadata;
  occurredAt: string;
  scope: string;
  stack: string | null;
};

type MonitoringAdapter = (entry: MonitoringRecord) => Promise<void> | void;

const MONITORING_STORAGE_KEY = 'inqoura/monitoring/v1';
const MAX_STORED_MONITORING_RECORDS = 80;

let monitoringAdapter: MonitoringAdapter | null = null;

function sanitizeMetadata(metadata?: MonitoringMetadata) {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  );
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown error',
    stack: null,
  };
}

async function persistMonitoringRecord(entry: MonitoringRecord) {
  try {
    const rawValue = await AsyncStorage.getItem(MONITORING_STORAGE_KEY);
    const currentEntries = rawValue ? (JSON.parse(rawValue) as MonitoringRecord[]) : [];
    const nextEntries = [...currentEntries, entry].slice(-MAX_STORED_MONITORING_RECORDS);
    await AsyncStorage.setItem(MONITORING_STORAGE_KEY, JSON.stringify(nextEntries));
  } catch {
    // Monitoring should never break app execution.
  }
}

function recordMonitoringEntry(
  level: MonitoringLevel,
  scope: string,
  error: unknown,
  metadata?: MonitoringMetadata
) {
  const normalizedError = normalizeError(error);
  const entry: MonitoringRecord = {
    level,
    message: normalizedError.message,
    metadata: sanitizeMetadata(metadata),
    occurredAt: new Date().toISOString(),
    scope,
    stack: normalizedError.stack,
  };

  if (__DEV__) {
    console.warn('[Monitoring]', level, scope, entry.message, entry.metadata);
  }

  void persistMonitoringRecord(entry);
  void Promise.resolve(monitoringAdapter?.(entry)).catch(() => null);
}

export function setMonitoringAdapter(adapter: MonitoringAdapter | null) {
  monitoringAdapter = adapter;
}

export function recordFatalError(
  scope: string,
  error: unknown,
  metadata?: MonitoringMetadata
) {
  recordMonitoringEntry('fatal', scope, error, metadata);
}

export function recordNonFatalError(
  scope: string,
  error: unknown,
  metadata?: MonitoringMetadata
) {
  recordMonitoringEntry('nonfatal', scope, error, metadata);
}

export function installGlobalErrorMonitoring() {
  const candidateGlobal = globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
      setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
    };
  };
  const errorUtils = candidateGlobal.ErrorUtils;

  if (!errorUtils?.setGlobalHandler) {
    return () => {};
  }

  const previousHandler = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error, isFatal) => {
    if (isFatal) {
      recordFatalError('app.global', error, { isFatal: true });
    } else {
      recordNonFatalError('app.global', error, { isFatal: false });
    }

    previousHandler?.(error, isFatal);
  });

  return () => {
    if (previousHandler) {
      errorUtils.setGlobalHandler?.(previousHandler);
    }
  };
}

export async function loadRecentMonitoringRecords() {
  try {
    const rawValue = await AsyncStorage.getItem(MONITORING_STORAGE_KEY);
    return rawValue ? (JSON.parse(rawValue) as MonitoringRecord[]) : [];
  } catch {
    return [];
  }
}
