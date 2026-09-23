import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useBasketStore, type BasketItem } from '../../store/basketStore';
import { triggerSafeHaptic, triggerSelectionHaptic } from '../../utils/haptics';

export default function DynamicBasketIsland() {
  const { totalItems, averageScore, allergenAlertCount, items, removeItem, clear } =
    useBasketStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (totalItems === 0) return null;

  const handleToggle = () => {
    triggerSelectionHaptic();
    setIsExpanded(!isExpanded);
  };

  const scoreColor = averageScore >= 70 ? '#10b981' : averageScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <>
      {/* Floating Island Pill */}
      <View style={styles.floatingWrapper} pointerEvents="box-none">
        <Pressable onPress={handleToggle} style={styles.islandPill}>
          <View style={styles.pillLeft}>
            <Text style={styles.cartIcon}>🛒</Text>
            <Text style={styles.itemCountText}>{totalItems}</Text>
          </View>

          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreText}>{averageScore}</Text>
          </View>

          {allergenAlertCount > 0 && (
            <View style={styles.hazardBeacon}>
              <Text style={styles.hazardText}>⚠ {allergenAlertCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Itemized Cart Modal Sheet */}
      <Modal
        animationType="slide"
        transparent
        visible={isExpanded}
        onRequestClose={() => setIsExpanded(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsExpanded(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Continuous Basket ({totalItems})</Text>
                <Text style={styles.sheetSubtitle}>
                  Average Health Score: <Text style={{ color: scoreColor, fontWeight: '800' }}>{averageScore}/100</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerSafeHaptic();
                  clear();
                  setIsExpanded(false);
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Clear All</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
              {items.map((item: BasketItem) => (
                <View key={`${item.product.barcode}-${item.scannedAt}`} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text numberOfLines={1} style={styles.itemName}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.itemBrand}>{item.product.brand || item.product.barcode}</Text>
                  </View>
                  <View style={styles.itemScoreTag}>
                    <Text style={[styles.itemScoreValue, { color: item.score >= 70 ? '#10b981' : '#ef4444' }]}>
                      {item.score}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      triggerSafeHaptic();
                      removeItem(item.product.barcode);
                    }}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <Pressable style={styles.closeSheetBtn} onPress={() => setIsExpanded(false)}>
              <Text style={styles.closeSheetText}>Close Cart</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  islandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  pillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartIcon: {
    fontSize: 16,
  },
  itemCountText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  hazardBeacon: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hazardText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '65%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  itemList: {
    maxHeight: 280,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  itemBrand: {
    fontSize: 12,
    color: '#9ca3af',
  },
  itemScoreTag: {
    paddingHorizontal: 8,
  },
  itemScoreValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  removeBtn: {
    padding: 6,
  },
  removeBtnText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  closeSheetBtn: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  closeSheetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
