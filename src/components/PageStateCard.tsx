import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from './AppLanguageProvider';
import { useAppTheme } from './AppThemeProvider';

type PageStateCardProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  subtitle: string;
  title: string;
  tone?: 'default' | 'accent';
};

export default function PageStateCard({
  icon = 'sparkles-outline',
  subtitle,
  title,
  tone = 'default',
}: PageStateCardProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const isAccent = tone === 'accent';

  return (
    <View style={[styles.card, isAccent && styles.cardAccent]}>
      <View style={[styles.iconWrap, isAccent && styles.iconWrapAccent]}>
        <Ionicons color={isAccent ? colors.primary : colors.textMuted} name={icon} size={18} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{t(title)}</Text>
        <Text style={styles.subtitle}>{t(subtitle)}</Text>
      </View>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    card: {
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 14,
      padding: 18,
    },
    cardAccent: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    iconWrap: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 18,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    iconWrapAccent: {
      backgroundColor: colors.surface,
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
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 22,
    },
  });
