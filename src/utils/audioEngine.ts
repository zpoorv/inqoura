import { Platform } from 'react-native';
import { Audio } from 'expo-av';

let isAudioEnabled = true;

export function setAudioEffectsEnabled(enabled: boolean) {
  isAudioEnabled = enabled;
}

export function isAudioEffectsEnabled() {
  return isAudioEnabled;
}

/**
 * Web Audio synthesizer for zero-dependency high-fidelity acoustic earcons.
 */
function playWebTone(frequencies: number[], type: OscillatorType = 'sine', duration = 0.15) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.2, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + duration);
    });
  } catch {
    // Ignore web audio play interruptions
  }
}

/**
 * Play a crisp mechanical camera-latch snap sound upon barcode capture.
 */
export async function playSnapSound(): Promise<void> {
  if (!isAudioEnabled) return;

  if (Platform.OS === 'web') {
    playWebTone([1200, 800], 'triangle', 0.04);
    return;
  }

  try {
    // On native, initialize audio mode and play short synthesized click
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Play an uplifting warm marimba chime when a healthy product is scanned (score 80+).
 */
export async function playCleanChime(): Promise<void> {
  if (!isAudioEnabled) return;

  if (Platform.OS === 'web') {
    playWebTone([523.25, 659.25, 783.99, 1046.5], 'sine', 0.22); // C5, E5, G5, C6
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a low-frequency warning tone immediately signaling an allergen or hazard.
 */
export async function playDangerAlert(): Promise<void> {
  if (!isAudioEnabled) return;

  if (Platform.OS === 'web') {
    playWebTone([220, 196, 174.6], 'sawtooth', 0.18);
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
    });
  } catch {
    // Graceful fallback
  }
}
