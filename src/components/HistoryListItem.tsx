import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from './AppLanguageProvider';
import { useAppTheme } from './AppThemeProvider';
import type { ScanHistoryEntry } from '../services/scanHistoryStorage';
import { getDietProfileDefinition } from '../utils/dietProfiles';
import { getGradeTone } from '../utils/gradeTone';
import { formatProductName } from '../utils/productDisplay';

type HistoryListItemProps = {
  entry: ScanHistoryEntry;
  isFavorite?: boolean;
  isSelected?: boolean;
  onDelete: () => void;
  onLongPress?: () => void;
  onPress: () => void;
  selectionMode?: boolean;
};

function formatTimestamp(value: string) {
  const date = new Date(value);

  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
}

function HistoryListItem({
  entry,
  isFavorite = false,
  isSelected = false,
  onDelete,
  onLongPress,
  onPress,
  selectionMode = false,
}: HistoryListItemProps) {
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const gradeTone = getGradeTone(entry.gradeLabel);
  const profile = getDietProfileDefinition(entry.profileId);
  const latestTimelineSummary = entry.productTimeline[0]?.summary ?? null;
  const hasTimelineUpdate = Boolean(latestTimelineSummary);

  return (
    <Pressable
      onLongPress={onLongPress}
      onPress={onPress}
      style={[
        styles.card,
        isSelected && {
          borderColor: colors.primary,
          backgroundColor: colors.primaryMuted,
        },
      ]}
    >
      <View
        style={[
          styles.toneStrip,
          { backgroundColor: gradeTone.color },
        ]}
      />
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text numberOfLines={2} style={styles.name}>
            {formatProductName(entry.name)}
          </Text>
          <View style={styles.metaChipRow}>
            <View style={styles.metaChip}>
              <Text numberOfLines={1} style={styles.metaChipText}>
                {entry.barcode}
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Text numberOfLines={1} style={styles.metaChipText}>
                {t(profile.label)}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.scoreBadge,
            { backgroundColor: gradeTone.backgroundColor },
          ]}
        >
          <Text style={[styles.scoreText, { color: gradeTone.color }]}>
            {entry.score === null ? t('N/A') : `${entry.score}/100`}
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons color={colors.textMuted} name="sparkles-outline" size={16} />
          <Text style={styles.summaryLabel}>{t('Main note')}</Text>
        </View>
        <Text style={styles.summaryText}>{t(entry.riskSummary)}</Text>
      </View>

      {hasTimelineUpdate ? (
        <View style={styles.timelineCard}>
          <Ionicons color={colors.warning} name="time-outline" size={15} />
          <Text numberOfLines={2} style={styles.timelineText}>
            {t('Changed')}: {t(latestTimelineSummary)}
          </Text>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={styles.timestampText}>{formatTimestamp(entry.scannedAt)}</Text>
        <View style={styles.footerActions}>
          {selectionMode ? (
            <View
              style={[
                styles.selectionChip,
                isSelected && styles.selectionChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.selectionChipText,
                  isSelected && styles.selectionChipTextSelected,
                ]}
              >
                {isSelected ? t('Selected') : t('Select')}
              </Text>
            </View>
          ) : (
            <Pressable onPress={onDelete} style={styles.deleteChip}>
              <Text style={styles.deleteChipText}>{t('Delete')}</Text>
            </Pressable>
          )}
          <View
            style={[
              styles.gradeChip,
              { backgroundColor: gradeTone.backgroundColor },
            ]}
          >
            <Text style={[styles.gradeText, { color: gradeTone.color }]}>
              {entry.gradeLabel
                ? t('Grade {grade}', { grade: entry.gradeLabel })
                : t('Not Scored')}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(HistoryListItem);

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors']
) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 12,
      overflow: 'hidden',
      padding: 18,
    },
    deleteChip: {
      backgroundColor: colors.dangerMuted,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    deleteChipText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '700',
    },
    footerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    gradeChip: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    gradeText: {
      fontSize: 13,
      fontWeight: '700',
    },
    headerRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
    },
    metaChip: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    metaChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: 2,
    },
    metaChipText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    name: {
      color: colors.text,
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 24,
    },
    scoreBadge: {
      borderRadius: 999,
      minWidth: 74,
      paddingHorizontal: 12,
      paddingVertical: 8,
      shadowColor: '#000',
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    },
    scoreText: {
      fontSize: 13,
      fontWeight: '800',
      textAlign: 'center',
    },
    summaryCard: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 6,
      padding: 14,
    },
    summaryHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    summaryText: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    selectionChip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    selectionChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selectionChipText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    selectionChipTextSelected: {
      color: colors.surface,
    },
    timestampText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    timelineCard: {
      alignItems: 'flex-start',
      backgroundColor: colors.warningMuted,
      borderRadius: 16,
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    timelineText: {
      color: colors.warning,
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 19,
    },
    titleWrap: {
      flex: 1,
      gap: 8,
      minWidth: 0,
    },
    toneStrip: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      top: 0,
      width: 4,
    },
  });
