import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from './AppThemeProvider';
import type { ResultAnalysis } from '../utils/resultAnalysis';

type PremiumGuidanceCardProps = {
  guidance: NonNullable<ResultAnalysis['premiumGuidance']>;
};

export default function PremiumGuidanceCard({
  guidance,
}: PremiumGuidanceCardProps) {
  const { colors, typography } = useAppTheme();
  const styles = createStyles(colors, typography);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Premium Guidance</Text>
      <Text style={styles.title}>Why this score?</Text>

      <View style={styles.copyBlock}>
        <Text style={styles.body}>{guidance.whyThisScore}</Text>
        <Text style={styles.body}>{guidance.useFrequencyGuidance}</Text>
        <Text style={styles.body}>{guidance.swapGuidance}</Text>
        {guidance.topConcern ? (
          <Text style={styles.concern}>Main concern: {guidance.topConcern}</Text>
        ) : null}
        {guidance.confidenceAssist ? (
          <Text style={styles.assist}>OCR assist: {guidance.confidenceAssist}</Text>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    assist: {
      color: colors.warning,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 21,
    },
    body: {
      color: colors.text,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 21,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 12,
      padding: 20,
    },
    concern: {
      color: colors.danger,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 21,
    },
    copyBlock: {
      gap: 10,
    },
    label: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 28,
    },
  });
