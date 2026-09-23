import AsyncStorage from '@react-native-async-storage/async-storage';

type AnalyticsValue = boolean | number | string | null | undefined;

export type LaunchAnalyticsEventName =
  | 'app_open'
  | 'history_reopened_result'
  | 'language_changed'
  | 'login_failed'
  | 'login_started'
  | 'login_succeeded'
  | 'notification_opened'
  | 'premium_purchase_failed'
  | 'premium_purchase_started'
  | 'premium_purchase_succeeded'
  | 'premium_restore_failed'
  | 'premium_restore_started'
  | 'premium_restore_succeeded'
  | 'premium_viewed'
  | 'result_opened'
  | 'scan_failed'
  | 'scan_started'
  | 'scan_succeeded'
  | 'signup_failed'
  | 'signup_started'
  | 'signup_succeeded';

export type LaunchAnalyticsMetadata = Record<string, AnalyticsValue>;

type AnalyticsEventRecord = {
  metadata: LaunchAnalyticsMetadata;
  name: LaunchAnalyticsEventName;
  occurredAt: string;
};

type AnalyticsAdapter = (event: AnalyticsEventRecord) => Promise<void> | void;

const ANALYTICS_STORAGE_KEY = 'inqoura/launch-analytics/v1';
const MAX_STORED_ANALYTICS_EVENTS = 120;

let analyticsAdapter: AnalyticsAdapter | null = null;

function sanitizeMetadata(metadata?: LaunchAnalyticsMetadata) {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  );
}

async function persistAnalyticsEvent(event: AnalyticsEventRecord) {
  try {
    const rawValue = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
    const currentEvents = rawValue ? (JSON.parse(rawValue) as AnalyticsEventRecord[]) : [];
    const nextEvents = [...currentEvents, event].slice(-MAX_STORED_ANALYTICS_EVENTS);
    await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(nextEvents));
  } catch {
    // Analytics should never block the app.
  }
}

export function setAnalyticsAdapter(adapter: AnalyticsAdapter | null) {
  analyticsAdapter = adapter;
}

export function trackAnalyticsEvent(
  name: LaunchAnalyticsEventName,
  metadata?: LaunchAnalyticsMetadata
) {
  const event: AnalyticsEventRecord = {
    metadata: sanitizeMetadata(metadata),
    name,
    occurredAt: new Date().toISOString(),
  };

  if (__DEV__) {
    console.info('[Analytics]', event.name, event.metadata);
  }

  void persistAnalyticsEvent(event);
  void Promise.resolve(analyticsAdapter?.(event)).catch(() => null);
}

export async function loadStoredAnalyticsEvents() {
  try {
    const rawValue = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
    return rawValue ? (JSON.parse(rawValue) as AnalyticsEventRecord[]) : [];
  } catch {
    return [];
  }
}
