import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Web-safe tactile haptic feedback orchestrator.
 * Delivers distinct sensory vibrations for different product safety verdicts.
 */

const isWeb = Platform.OS === 'web';

/**
 * Single crisp, gentle haptic confirmation (light tap) for clean/safe products.
 */
export async function triggerSafeHaptic(): Promise<void> {
  if (isWeb) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([40]);
    }
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Non-fatal fallback on unsupported hardware
  }
}

/**
 * Double medium-intensity vibration pulse for caution/moderate products.
 */
export async function triggerCautionHaptic(): Promise<void> {
  if (isWeb) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([60, 60, 60]);
    }
    return;
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Non-fatal fallback
  }
}

/**
 * Heavy triple pulsating pattern for hazardous allergen triggers.
 */
export async function triggerDangerHaptic(): Promise<void> {
  if (isWeb) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([100, 50, 100, 50, 150]);
    }
    return;
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 120);
  } catch {
    // Non-fatal fallback
  }
}

/**
 * Light selection tick for user interactions and toggles.
 */
export async function triggerSelectionHaptic(): Promise<void> {
  if (isWeb) return;

  try {
    await Haptics.selectionAsync();
  } catch {
    // Non-fatal fallback
  }
}
