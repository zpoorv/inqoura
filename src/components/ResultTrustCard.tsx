import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from './AppThemeProvider';
import type { ResultTrustSnapshot } from '../utils/resultAnalysis';

type ResultTrustCardProps = {
  trust: ResultTrustSnapshot;
};

function formatValue(value: string) {
  return value.replace(/-/g, ' ');
}

export default function ResultTrustCard({ trust }: ResultTrustCardProps) {
  const { colors, typography } = useAppTheme();
  const styles = createStyles(colors, typography);
  const rows = [
    ['Source', formatValue(trust.sourceCertainty)],
    ['Ingredients', formatValue(trust.ingredientCompleteness)],
    ['Nutrition', formatValue(trust.nutritionCompleteness)],
    ['OCR', formatValue(trust.ocrQuality)],
    ['Review', formatValue(trust.adminReviewState)],
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Trust check</Text>
      <Text style={styles.title}>How solid this read is</Text>
      <View style={styles.grid}>
        {rows.map(([name, value]) => (
          <View key={name} style={styles.row}>
            <Text style={styles.rowLabel}>{name}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
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
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 12,
      padding: 20,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    label: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    row: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
      width: '47%',
    },
    rowLabel: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    rowValue: {
      color: colors.text,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 4,
      textTransform: 'capitalize',
    },
    title: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 20,
      fontWeight: '800',
    },
  });
