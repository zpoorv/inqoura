import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export interface AdditiveDetail {
  code: string;
  name: string;
  hazardTier: 'high' | 'moderate' | 'low';
  regulatoryStatus: string;
  summary: string;
}

export interface AdditiveToxicologyModalProps {
  visible: boolean;
  additives: AdditiveDetail[];
  onClose: () => void;
}

export default function AdditiveToxicologyModal({
  visible,
  additives,
  onClose,
}: AdditiveToxicologyModalProps) {
  const getTierBadge = (tier: AdditiveDetail['hazardTier']) => {
    switch (tier) {
      case 'high':
        return { label: 'High Concern', bg: '#fee2e2', color: '#b91c1c' };
      case 'moderate':
        return { label: 'Moderate Caution', bg: '#fef3c7', color: '#b45309' };
      case 'low':
      default:
        return { label: 'GRAS / Low Concern', bg: '#dcfce7', color: '#15803d' };
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Additive Toxicology Dossier</Text>
              <Text style={styles.subtitle}>EFSA & FDA regulatory toxicology breakdown</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {additives.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Zero flagged chemical additives or preservatives.</Text>
              </View>
            ) : (
              additives.map((additive) => {
                const badge = getTierBadge(additive.hazardTier);
                return (
                  <View key={additive.code} style={styles.additiveCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.codeWrap}>
                        <Text style={styles.codeText}>{additive.code.toUpperCase()}</Text>
                        <Text style={styles.nameText}>{additive.name}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.regulatoryText}>Authority: {additive.regulatoryStatus}</Text>
                    <Text style={styles.summaryText}>{additive.summary}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  list: {
    maxHeight: 380,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  additiveCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  codeWrap: {
    flex: 1,
    marginRight: 8,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  nameText: {
    fontSize: 12,
    color: '#4b5563',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  regulatoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});
