import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const EXPIRY_DATE_REGEX = /(?:EXP|BB|BEST BEFORE|USE BY)[:\s]*(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/i;

export interface ExtractedExpiryDate {
  rawMatch: string;
  day: number;
  month: number;
  year: number;
  date: Date;
}

/**
 * Scans raw packaging OCR text to extract expiration and best-before date stamps.
 */
export function extractExpiryDate(ocrText: string): ExtractedExpiryDate | null {
  if (!ocrText) return null;

  const match = ocrText.match(EXPIRY_DATE_REGEX);
  if (!match) return null;

  const rawMatch = match[0];
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);

  // Normalize 2-digit years
  if (year < 100) {
    year += 2000;
  }

  // Validate range
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(year, month - 1, day, 9, 0, 0); // Default to 9:00 AM
  return {
    rawMatch,
    day,
    month,
    year,
    date,
  };
}

/**
 * Schedules a local push notification 48 hours prior to product expiration.
 */
export async function schedulePantryExpiryNotification(
  productName: string,
  expiryDate: Date
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;
    const triggerTimestamp = expiryDate.getTime() - fortyEightHoursMs;

    // Do not schedule if already past the 48-hour alert window
    if (triggerTimestamp <= Date.now()) {
      return null;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: reqStatus } = await Notifications.requestPermissionsAsync();
      if (reqStatus !== 'granted') return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pantry Expiry Warning ⏳',
        body: `${productName} will expire in 48 hours. Use it soon to prevent food waste!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerTimestamp),
      },
    });

    return identifier;
  } catch {
    return null;
  }
}
