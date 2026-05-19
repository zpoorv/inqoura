import { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from './AppLanguageProvider';
import { useAppTheme } from './AppThemeProvider';

type HeroCardProps = PropsWithChildren<{
  eyebrow?: string;
  subtitle: string;
  title: string;
}>;

export default function HeroCard({
  children,
  eyebrow,
  subtitle,
  title,
}: HeroCardProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{t(eyebrow)}</Text> : null}
      <Text style={styles.title}>{t(title)}</Text>
      <Text style={styles.subtitle}>{t(subtitle)}</Text>
      {children ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    body: {
      gap: 12,
      paddingTop: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 28,
      borderWidth: 1,
      gap: 8,
      overflow: 'hidden',
      padding: 22,
    },
    eyebrow: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    subtitle: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 15,
      lineHeight: 22,
    },
    title: {
      color: colors.text,
      fontFamily: typography.displayFontFamily,
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 34,
    },
  });
