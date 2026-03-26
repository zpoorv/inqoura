import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { getThemeColors } from '../constants/theme';
import type { AppearanceMode } from '../models/preferences';
import {
  loadAppearanceMode,
  saveAppearanceMode,
} from '../services/themePreferenceStorage';

type AppThemeContextValue = {
  appearanceMode: AppearanceMode;
  colors: ReturnType<typeof getThemeColors>;
  setAppearanceMode: (mode: AppearanceMode) => Promise<void>;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export default function AppThemeProvider({ children }: PropsWithChildren) {
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>('light');

  useEffect(() => {
    let isMounted = true;

    void loadAppearanceMode().then((mode) => {
      if (isMounted) {
        setAppearanceModeState(mode);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      appearanceMode,
      colors: getThemeColors(appearanceMode),
      setAppearanceMode: async (mode) => {
        setAppearanceModeState(mode);
        await saveAppearanceMode(mode);
      },
    }),
    [appearanceMode]
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);

  if (!value) {
    throw new Error('useAppTheme must be used inside AppThemeProvider.');
  }

  return value;
}
