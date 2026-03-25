import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import HistoryListItem from '../components/HistoryListItem';
import { colors } from '../constants/colors';
import type { RootStackParamList } from '../navigation/types';
import {
  deleteScanHistoryEntries,
  loadScanHistory,
  type ScanHistoryEntry,
} from '../services/scanHistoryStorage';

type HistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'History'>;
type SortOrder = 'newest' | 'oldest';

function matchesQuery(entry: ScanHistoryEntry, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    entry.name,
    entry.barcode,
    entry.riskSummary,
    entry.gradeLabel,
  ]
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const [historyEntries, setHistoryEntries] = useState<ScanHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isMounted = true;

    const loadHistory = async () => {
      setIsLoading(true);

      try {
        const nextEntries = await loadScanHistory();

        if (isMounted) {
          setHistoryEntries(nextEntries);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

  const visibleEntries = useMemo(() => {
    const filteredEntries = historyEntries.filter((entry) =>
      matchesQuery(entry, searchQuery)
    );

    return filteredEntries.sort((left, right) => {
      const leftTime = new Date(left.scannedAt).getTime();
      const rightTime = new Date(right.scannedAt).getTime();

      return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
    });
  }, [historyEntries, searchQuery, sortOrder]);
  const selectionMode = selectedEntryIds.length > 0;

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntryIds((currentIds) =>
      currentIds.includes(entryId)
        ? currentIds.filter((id) => id !== entryId)
        : [...currentIds, entryId]
    );
  };

  const handleDeleteEntries = async (entryIds: string[]) => {
    const nextEntries = await deleteScanHistoryEntries(entryIds);

    setHistoryEntries(nextEntries);
    setSelectedEntryIds((currentIds) =>
      currentIds.filter((id) => !entryIds.includes(id))
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedEntryIds.length === visibleEntries.length) {
      setSelectedEntryIds([]);
      return;
    }

    setSelectedEntryIds(visibleEntries.map((entry) => entry.id));
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.eyebrowChip}>
            <Text style={styles.eyebrowText}>Saved Scans</Text>
          </View>
          <Text style={styles.title}>Review products you scanned earlier</Text>
          <Text style={styles.subtitle}>
            Search by product name, barcode, or risk note, then reopen the full
            result screen with one tap.
          </Text>
        </View>

        <View style={styles.controls}>
          <TextInput
            onChangeText={setSearchQuery}
            placeholder="Search scan history"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={searchQuery}
          />

          <View style={styles.sortRow}>
            {(['newest', 'oldest'] as const).map((option) => {
              const isSelected = sortOrder === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => setSortOrder(option)}
                  style={[
                    styles.sortChip,
                    isSelected && styles.sortChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      isSelected && styles.sortChipTextSelected,
                    ]}
                  >
                    {option === 'newest' ? 'Newest' : 'Oldest'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {visibleEntries.length > 0 ? (
            <View style={styles.selectionActions}>
              <Pressable
                onPress={handleToggleSelectAll}
                style={styles.selectionActionChip}
              >
                <Text style={styles.selectionActionText}>
                  {selectedEntryIds.length === visibleEntries.length
                    ? 'Clear All'
                    : 'Select All'}
                </Text>
              </Pressable>
              {selectionMode ? (
                <>
                  <Pressable
                    onPress={() => setSelectedEntryIds([])}
                    style={styles.selectionActionChip}
                  >
                    <Text style={styles.selectionActionText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteEntries(selectedEntryIds)}
                    style={styles.deleteActionChip}
                  >
                    <Text style={styles.deleteActionText}>
                      Delete Selected
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.stateText}>Loading scan history...</Text>
          </View>
        ) : visibleEntries.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={visibleEntries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HistoryListItem
                entry={item}
                isSelected={selectedEntryIds.includes(item.id)}
                onDelete={() => handleDeleteEntries([item.id])}
                onLongPress={() => toggleEntrySelection(item.id)}
                onPress={() => {
                  if (selectionMode) {
                    toggleEntrySelection(item.id);
                    return;
                  }

                  navigation.push('Result', {
                    barcode: item.barcode,
                    barcodeType: item.barcodeType,
                    product: item.product,
                  });
                }}
                selectionMode={selectionMode}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>
              {searchQuery.trim()
                ? 'No scans matched your search'
                : 'No saved scans yet'}
            </Text>
            <Text style={styles.stateText}>
              {searchQuery.trim()
                ? 'Try a different name, barcode, or risk note.'
                : 'Scan a packaged product and it will appear here automatically.'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  controls: {
    gap: 12,
  },
  eyebrowChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  eyebrowText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  header: {
    gap: 10,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  deleteActionChip: {
    backgroundColor: colors.dangerMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  deleteActionText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sortChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  sortChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortChipText: {
    color: colors.text,
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
  selectionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectionActionChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  selectionActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    justifyContent: 'center',
    marginTop: 8,
    padding: 24,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  stateTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
});
