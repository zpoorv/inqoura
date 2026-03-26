import type { AppearanceMode } from '../models/preferences';

export type AppColors = {
  background: string;
  border: string;
  danger: string;
  dangerMuted: string;
  primary: string;
  primaryMuted: string;
  scanOverlay: string;
  success: string;
  successMuted: string;
  surface: string;
  text: string;
  textMuted: string;
  warning: string;
  warningMuted: string;
};

export const lightColors: AppColors = {
  background: '#F4F7F3',
  border: '#D7E1DC',
  danger: '#C43D32',
  dangerMuted: '#F9E2DF',
  primary: '#1F6F5B',
  primaryMuted: '#D9EEE7',
  scanOverlay: 'rgba(23, 33, 31, 0.58)',
  success: '#2E8B57',
  successMuted: '#DFF1E6',
  surface: '#FFFFFF',
  text: '#17211F',
  textMuted: '#5F6F69',
  warning: '#C28518',
  warningMuted: '#F6E9C9',
};

export const darkColors: AppColors = {
  background: '#101715',
  border: '#2A3A35',
  danger: '#F47B71',
  dangerMuted: '#4A241E',
  primary: '#63C7A6',
  primaryMuted: '#183A32',
  scanOverlay: 'rgba(6, 10, 9, 0.74)',
  success: '#72D89A',
  successMuted: '#173224',
  surface: '#17211F',
  text: '#F3F7F5',
  textMuted: '#AAB9B3',
  warning: '#F0BC61',
  warningMuted: '#43320F',
};

export function getThemeColors(mode: AppearanceMode) {
  return mode === 'dark' ? darkColors : lightColors;
}
