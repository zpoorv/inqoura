import { Ionicons } from '@expo/vector-icons';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import HistoryListItem from '../../components/HistoryListItem';
import HistoryListItemSkeleton from '../../components/HistoryListItemSkeleton';
import ScreenReveal from '../../components/ScreenReveal';
import { useI18n } from '../../components/AppLanguageProvider';
import { useAppTheme } from '../../components/AppThemeProvider';
import type { RootStackParamList } from '../../navigation/types';
import { trackAnalyticsEvent } from '../../services/analyticsService';
import { measurePerformanceTrace } from '../../services/performanceTrace';
import {
  loadSessionScanHistory,
} from '../../services/sessionDataService';
import {
  readSessionResourceCache,
  SESSION_CACHE_KEYS,
} from '../../services/sessionResourceCache';
import {
  deleteScanHistoryEntries,
  subscribeScanHistoryChanges,
  type ScanHistoryEntry,
} from '../../services/scanHistoryStorage';
import { getDietProfileDefinition } from '../../utils/dietProfiles';

type HistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'History'>;
type SortOrder = 'newest' | 'oldest';
type HistoryListRow = ScanHistoryEntry | number;

function matchesQuery(entry: ScanHistoryEntry, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [entry.name, entry.barcode, entry.riskSummary, entry.gradeLabel, getDietProfileDefinition(entry.profileId).label]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
}

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const insets = useSafeAreaInsets();
  const cachedHistoryEntries = readSessionResourceCache<ScanHistoryEntry[]>(
    SESSION_CACHE_KEYS.scanHistory
  );
  const [hasMeasuredList, setHasMeasuredList] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<ScanHistoryEntry[]>(
    cachedHistoryEntries ?? []
  );
  const [isLoading, setIsLoading] = useState(cachedHistoryEntries === null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadHistory = async (
        policy: Parameters<typeof loadSessionScanHistory>[0] = 'cache-first',
        showLoading = historyEntries.length === 0
      ) => {
        if (showLoading) {
          setIsLoading(true);
        }

        try {
          const nextEntries = await loadSessionScanHistory(policy);

          if (!isMounted) {
            return;
          }

          setHistoryEntries(nextEntries);

          if (!hasMeasuredList) {
            measurePerformanceTrace('app-start', 'history-overview-ready');
            setHasMeasuredList(true);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      const unsubscribe = subscribeScanHistoryChanges(() => {
        void loadHistory('stale-while-revalidate', false);
      });

      void loadHistory(historyEntries.length > 0 ? 'stale-while-revalidate' : 'cache-first');

      return () => {
        isMounted = false;
        unsubscribe();
      };
    }, [hasMeasuredList, historyEntries.length])
  );

  const visibleEntries = useMemo(() => {
    const filteredEntries = historyEntries.filter((entry) =>
      matchesQuery(entry, deferredSearchQuery)
    );

    return filteredEntries.sort((left, right) => {
      const leftTime = new Date(left.scannedAt).getTime();
      const rightTime = new Date(right.scannedAt).getTime();
      return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
    });
  }, [deferredSearchQuery, historyEntries, sortOrder]);
  const selectionMode = selectedEntryIds.length > 0;
  const selectedEntryIdSet = useMemo(() => new Set(selectedEntryIds), [selectedEntryIds]);

  const listData = useMemo<HistoryListRow[]>(() => {
    if (isLoading) {
      return [1, 2, 3, 4];
    }

    return visibleEntries;
  }, [isLoading, visibleEntries]);

  const handleDeleteEntries = useCallback(async (entryIds: string[]) => {
    const nextEntries = await deleteScanHistoryEntries(entryIds);
    setHistoryEntries(nextEntries);
    setSelectedEntryIds((currentIds) => currentIds.filter((id) => !entryIds.includes(id)));
  }, []);

  const renderHistoryItem = useCallback(
    ({ item }: { item: ScanHistoryEntry }) => (
      <HistoryListItem
        entry={item}
        isFavorite={false}
        isSelected={selectedEntryIdSet.has(item.id)}
        onDelete={() => void handleDeleteEntries([item.id])}
        onLongPress={() =>
          setSelectedEntryIds((currentIds) =>
            currentIds.includes(item.id)
              ? currentIds.filter((id) => id !== item.id)
              : [...currentIds, item.id]
          )
        }
        onPress={() => {
          if (selectionMode) {
            setSelectedEntryIds((currentIds) =>
              currentIds.includes(item.id)
                ? currentIds.filter((id) => id !== item.id)
                : [...currentIds, item.id]
            );
            return;
          }

          trackAnalyticsEvent('history_reopened_result', {
            barcodeType: item.barcodeType ?? 'unknown',
            profileId: item.profileId,
          });
          navigation.push('Result', {
            barcode: item.barcode,
            barcodeType: item.barcodeType,
            persistToHistory: false,
            profileId: item.profileId,
            product: item.product,
          });
        }}
        selectionMode={selectionMode}
      />
    ),
    [handleDeleteEntries, navigation, selectedEntryIdSet, selectionMode]
  );

  const headerContent = (
    <ScreenReveal style={styles.headerContent}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>{t('History')}</Text>
        <Text style={styles.title}>{t('Your scan timeline')}</Text>
        <Text style={styles.subtitle}>
          {t('Reopen your latest decisions, search product names fast, and keep the list clean.')}
        </Text>
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatPill}>
            <Text style={styles.heroStatLabel}>{t('Scans')}</Text>
            <Text style={styles.heroStatValue}>{historyEntries.length}</Text>
          </View>
          <View style={styles.heroStatPill}>
            <Text style={styles.heroStatLabel}>{t('Showing')}</Text>
            <Text style={styles.heroStatValue}>{visibleEntries.length}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Scanner')} style={styles.searchShortcut}>
            <Text style={styles.searchShortcutText}>{t('Scan again')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.controlsCard}>
        <View style={styles.searchInputRow}>
          <View style={styles.searchIconWrap}>
            <Ionicons color={colors.textMuted} name="search-outline" size={18} />
          </View>
          <TextInput
            onChangeText={setSearchQuery}
            placeholder={t('Search by product, barcode, or note')}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={searchQuery}
          />
        </View>
        <View style={styles.sortRow}>
          {(['newest', 'oldest'] as const).map((option) => {
            const isSelected = sortOrder === option;

            return (
              <Pressable
                key={option}
                onPress={() => setSortOrder(option)}
                style={[styles.sortChip, isSelected && styles.sortChipSelected]}
              >
                <Text
                  style={[styles.sortChipText, isSelected && styles.sortChipTextSelected]}
                >
                  {option === 'newest' ? t('Newest') : t('Oldest')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {visibleEntries.length > 0 ? (
          <View style={styles.selectionActions}>
            <Pressable
              onPress={() =>
                setSelectedEntryIds(
                  selectedEntryIds.length === visibleEntries.length
                    ? []
                    : visibleEntries.map((entry) => entry.id)
                )
              }
              style={styles.selectionActionChip}
            >
              <Text style={styles.selectionActionText}>
                {selectedEntryIds.length === visibleEntries.length
                  ? t('Clear All')
                  : t('Select All')}
              </Text>
            </Pressable>
            {selectionMode ? (
              <>
                <Pressable
                  onPress={() => setSelectedEntryIds([])}
                  style={styles.selectionActionChip}
                >
                  <Text style={styles.selectionActionText}>{t('Cancel')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleDeleteEntries(selectedEntryIds)}
                  style={styles.deleteActionChip}
                >
                  <Text style={styles.deleteActionText}>{t('Delete Selected')}</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScreenReveal>
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 108 + Math.max(insets.bottom, 16) },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        data={listData}
        initialNumToRender={8}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => (typeof item === 'number' ? `history-skeleton-${item}` : item.id)}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>
                {searchQuery.trim()
                  ? t('No scans matched your search')
                  : t('No saved scans yet')}
              </Text>
              <Text style={styles.stateText}>
                {searchQuery.trim()
                  ? t('Try a different name, barcode, or risk note.')
                  : t('Scan a packaged product and it will appear here automatically.')}
              </Text>
            </View>
          ) : null
        }
        ListHeaderComponent={headerContent}
        maxToRenderPerBatch={8}
        renderItem={({ item }) =>
          typeof item === 'number' ? <HistoryListItemSkeleton /> : renderHistoryItem({ item })
        }
        showsVerticalScrollIndicator={false}
        style={styles.list}
        updateCellsBatchingPeriod={60}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    controlsCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 12,
      padding: 18,
    },
    deleteActionChip: {
      alignItems: 'center',
      backgroundColor: colors.dangerMuted,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    deleteActionText: {
      color: colors.danger,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
    },
    eyebrow: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    headerContent: {
      gap: 16,
      paddingBottom: 18,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 28,
      borderWidth: 1,
      gap: 8,
      overflow: 'hidden',
      padding: 22,
    },
    heroStatLabel: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 12,
    },
    heroStatPill: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 4,
      minWidth: 84,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    heroStatValue: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 18,
      fontWeight: '800',
    },
    heroStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingTop: 4,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: 24,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    searchInput: {
      color: colors.text,
      flex: 1,
      fontFamily: typography.bodyFontFamily,
      fontSize: 15,
      paddingRight: 4,
      paddingVertical: 14,
    },
    searchInputRow: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 14,
    },
    searchIconWrap: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    searchShortcut: {
      alignItems: 'center',
      backgroundColor: colors.primaryMuted,
      borderRadius: 18,
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    searchShortcutText: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
    },
    selectionActionChip: {
      alignItems: 'center',
      backgroundColor: colors.primaryMuted,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    selectionActionText: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
    },
    selectionActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    sortChip: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    sortChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sortChipText: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 13,
      fontWeight: '700',
    },
    sortChipTextSelected: {
      color: colors.surface,
    },
    sortRow: {
      flexDirection: 'row',
      gap: 10,
    },
    stateCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 8,
      padding: 20,
    },
    stateText: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 15,
      lineHeight: 22,
    },
    stateTitle: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 20,
      fontWeight: '800',
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
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 36,
    },
  });
