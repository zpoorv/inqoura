import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from './AppLanguageProvider';
import { useAppTheme } from './AppThemeProvider';

type ActionCardProps = {
  badge?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  subtitle: string;
  title: string;
};

export default function ActionCard({
  badge,
  icon,
  onPress,
  subtitle,
  title,
}: ActionCardProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: colors.primaryMuted }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons color={colors.primary} name={icon} size={22} />
      </View>
      <View style={styles.copy}>
        {badge ? (
          <Text numberOfLines={1} style={styles.badge}>
            {t(badge)}
          </Text>
        ) : null}
        <Text numberOfLines={2} style={styles.title}>
          {t(title)}
        </Text>
        <Text numberOfLines={3} style={styles.subtitle}>
          {t(subtitle)}
        </Text>
      </View>
      <View style={styles.chevronWrap}>
        <Ionicons color={colors.primary} name="arrow-forward" size={18} />
      </View>
    </Pressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    badge: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    card: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 14,
      overflow: 'hidden',
      paddingHorizontal: 18,
      paddingVertical: 18,
    },
    cardPressed: {
      transform: [{ scale: 0.985 }],
    },
    chevronWrap: {
      alignItems: 'center',
      backgroundColor: colors.primaryMuted,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    copy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    iconWrap: {
      alignItems: 'center',
      backgroundColor: colors.primaryMuted,
      borderRadius: 18,
      height: 50,
      justifyContent: 'center',
      width: 50,
    },
    subtitle: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 20,
    },
    title: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 23,
    },
  });
