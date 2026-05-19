import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from './AppLanguageProvider';
import { useAppTheme } from './AppThemeProvider';
import type { MainNavigationRoute } from '../navigation/navigationRef';

type BottomMenuBarProps = {
  activeRoute?: MainNavigationRoute;
  onSelectRoute: (route: MainNavigationRoute) => void;
};

type BottomMenuItem = {
  activeIcon: keyof typeof Ionicons.glyphMap;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: MainNavigationRoute;
};

const ITEMS: BottomMenuItem[] = [
  {
    activeIcon: 'home',
    icon: 'home-outline',
    label: 'Home',
    route: 'Home',
  },
  { activeIcon: 'time', icon: 'time-outline', label: 'History', route: 'History' },
  { activeIcon: 'scan', icon: 'scan-outline', label: 'Scan', route: 'Scanner' },
  {
    activeIcon: 'person-circle',
    icon: 'person-circle-outline',
    label: 'Account',
    route: 'Account',
  },
  {
    activeIcon: 'sparkles',
    icon: 'sparkles-outline',
    label: 'Premium',
    route: 'Premium',
  },
];

const EDGE_ITEMS = new Set<MainNavigationRoute>(['Home', 'Premium']);

export default function BottomMenuBar({
  activeRoute,
  onSelectRoute,
}: BottomMenuBarProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.bar}>
        {ITEMS.map((item) => {
          const isActive = item.route === activeRoute;
          const isCenter = item.route === 'Scanner';
          const isEdge = EDGE_ITEMS.has(item.route);

          return (
            <Pressable
              accessibilityLabel={t(item.label)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              hitSlop={10}
              key={item.route}
              onPress={() => {
                if (item.route !== activeRoute) {
                  onSelectRoute(item.route);
                }
              }}
              style={({ pressed }) => [
                styles.item,
                isCenter && styles.centerItem,
                isEdge && styles.edgeItem,
                pressed && styles.itemPressed,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  !isCenter && styles.iconWrapIdle,
                  isActive && styles.iconWrapActive,
                  isCenter && styles.iconWrapCenter,
                  isActive && isCenter && styles.iconWrapCenterActive,
                ]}
              >
                <Ionicons
                  color={
                    isActive
                      ? isCenter
                        ? colors.surface
                        : colors.primary
                      : isCenter
                        ? colors.surface
                        : colors.text
                  }
                  name={isActive ? item.activeIcon : item.icon}
                  size={isCenter ? 24 : 22}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  !isActive && styles.labelInactive,
                  isCenter && styles.labelCenter,
                ]}
              >
                {t(item.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    bar: {
      alignItems: 'flex-end',
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      borderColor: colors.border,
      borderRadius: 32,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 8,
      paddingHorizontal: 12,
      paddingTop: 12,
      shadowColor: '#000',
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    centerItem: {
      marginTop: -18,
    },
    edgeItem: {
      paddingHorizontal: 4,
    },
    iconWrap: {
      alignItems: 'center',
      borderRadius: 20,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    iconWrapActive: {
      backgroundColor: colors.primaryMuted,
    },
    iconWrapCenter: {
      backgroundColor: colors.text,
      borderColor: colors.surface,
      borderRadius: 999,
      borderWidth: 4,
      height: 64,
      shadowColor: '#000',
      shadowOffset: { height: 8, width: 0 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      width: 64,
    },
    iconWrapCenterActive: {
      backgroundColor: colors.primary,
    },
    iconWrapIdle: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
    },
    item: {
      alignItems: 'center',
      flex: 1,
      gap: 8,
      minHeight: 78,
      paddingBottom: 10,
      paddingTop: 4,
    },
    itemPressed: {
      opacity: 0.88,
    },
    label: {
      color: colors.text,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 15,
      textAlign: 'center',
    },
    labelActive: {
      color: colors.primary,
    },
    labelCenter: {
      marginTop: 2,
    },
    labelInactive: {
      color: colors.textMuted,
      opacity: 0.95,
    },
    wrap: {
      backgroundColor: 'transparent',
      paddingHorizontal: 18,
      paddingTop: 10,
    },
  });
