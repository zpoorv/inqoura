export type AppearanceMode = 'dark' | 'light';

export function isAppearanceMode(value: string | null | undefined): value is AppearanceMode {
  return value === 'dark' || value === 'light';
}
