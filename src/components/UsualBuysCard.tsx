import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from './AppThemeProvider';
import type { ScanHistoryEntry } from '../services/scanHistoryStorage';

type UsualBuysCardProps = {
  entries: ScanHistoryEntry[];
  onOpenEntry: (entry: ScanHistoryEntry) => void;
};

export default function UsualBuysCard({
  entries,
  onOpenEntry,
}: UsualBuysCardProps) {
  const { colors, typography } = useAppTheme();
  const styles = createStyles(colors, typography);

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Usual buys</Text>
      <Text style={styles.title}>Products you keep coming back to</Text>
      {entries.map((entry) => (
        <Pressable
          key={entry.id}
          onPress={() => onOpenEntry(entry)}
          style={styles.row}
        >
          <View style={styles.textBlock}>
            <Text style={styles.rowTitle}>{entry.name}</Text>
            <Text style={styles.rowBody}>
              {entry.scanCount} scans • {entry.riskSummary}
            </Text>
          </View>
          <Text style={styles.score}>
            {typeof entry.score === 'number' ? Math.round(entry.score) : '--'}
          </Text>
        </Pressable>
      ))}
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
    label: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    row: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      padding: 14,
    },
    rowBody: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 13,
      lineHeight: 19,
    },
    rowTitle: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 15,
      fontWeight: '800',
    },
    score: {
      color: colors.primary,
      fontFamily: typography.numericFontFamily,
      fontSize: 20,
      fontWeight: '800',
    },
    textBlock: { flex: 1, gap: 4 },
    title: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 20,
      fontWeight: '800',
    },
  });
