import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../AppThemeProvider';
import { useI18n } from '../AppLanguageProvider';
import { triggerSafeHaptic } from '../../utils/haptics';

export interface FoodOrbitHeroProps {
  profileName: string;
  totalScans: number;
  cleanStreakDays?: number;
  onOpenScanner: () => void;
  onOpenContinuousScanner: () => void;
  onOpenDuel: () => void;
}

export default function FoodOrbitHero({
  profileName,
  totalScans,
  cleanStreakDays = 7,
  onOpenScanner,
  onOpenContinuousScanner,
  onOpenDuel,
}: FoodOrbitHeroProps) {
  const { t } = useI18n();
  const { colors } = useAppTheme();

  return (
    <View style={styles.orbitContainer}>
      {/* Planetary Orbit Header & Clean Streak */}
      <View style={styles.planetHeader}>
        <View style={styles.planetBadge}>
          <Text style={styles.planetEmoji}>🪐</Text>
          <View>
            <Text style={styles.planetStreakTitle}>
              {cleanStreakDays}-Day Clean Orbit
            </Text>
            <Text style={styles.planetStreakSubtitle}>
              Shopping for <Text style={styles.boldText}>{profileName}</Text> • {totalScans} verified items
            </Text>
          </View>
        </View>
        <View style={styles.shieldPill}>
          <Text style={styles.shieldText}>🛡️ Shield Active</Text>
        </View>
      </View>

      {/* Primary Hero Quick-Action: Instant Scanner */}
      <Pressable
        onPress={() => {
          triggerSafeHaptic();
          onOpenScanner();
        }}
        style={styles.mainScanButton}
      >
        <View style={styles.scanContent}>
          <View style={styles.scanIconWrap}>
            <Ionicons name="scan-outline" size={26} color="#ffffff" />
          </View>
          <View style={styles.scanTextWrap}>
            <Text style={styles.mainScanTitle}>{t('Instant Barcode Scan')}</Text>
            <Text style={styles.mainScanSubtitle}>{t('Zero-latency on-device verification')}</Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
      </Pressable>

      {/* Avant-Garde Multi-Product Power Action Grid */}
      <View style={styles.powerGrid}>
        <Pressable
          onPress={() => {
            triggerSafeHaptic();
            onOpenContinuousScanner();
          }}
          style={styles.powerCard}
        >
          <View style={[styles.powerIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <Ionicons name="cart-outline" size={20} color="#3b82f6" />
          </View>
          <View style={styles.powerCardText}>
            <Text style={styles.powerTitle}>Basket Sweep</Text>
            <Text style={styles.powerSubtitle}>Continuous Cart Mode</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerSafeHaptic();
            onOpenDuel();
          }}
          style={styles.powerCard}
        >
          <View style={[styles.powerIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
            <Ionicons name="git-compare-outline" size={20} color="#f59e0b" />
          </View>
          <View style={styles.powerCardText}>
            <Text style={styles.powerTitle}>Product Duel</Text>
            <Text style={styles.powerSubtitle}>Battle Two Items</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbitContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  planetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  planetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planetEmoji: {
    fontSize: 32,
  },
  planetStreakTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  planetStreakSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  boldText: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  shieldPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  shieldText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  mainScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563eb',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#2563eb',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  scanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTextWrap: {
    gap: 2,
  },
  mainScanTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  mainScanSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  powerGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  powerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  powerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerCardText: {
    flex: 1,
  },
  powerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  powerSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 1,
  },
});
