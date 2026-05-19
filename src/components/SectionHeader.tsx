import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from './AppLanguageProvider';
import { useAppTheme } from './AppThemeProvider';

type SectionHeaderProps = {
  subtitle?: string;
  title: string;
};

export default function SectionHeader({
  subtitle,
  title,
}: SectionHeaderProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t(title)}</Text>
      {subtitle ? <Text style={styles.subtitle}>{t(subtitle)}</Text> : null}
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    subtitle: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 20,
    },
    title: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 19,
      fontWeight: '800',
      lineHeight: 24,
    },
    wrap: {
      gap: 4,
    },
  });
