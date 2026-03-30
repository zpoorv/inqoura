import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';

import PrimaryButton from '../components/PrimaryButton';
import { useAppTheme } from '../components/AppThemeProvider';
import ScreenLoadingView from '../components/ScreenLoadingView';
import {
  PREMIUM_BONUS_FEATURES,
  PREMIUM_FEATURE_COPY,
  PREMIUM_FREE_PLAN_FEATURES,
  PREMIUM_MONTHLY_PRODUCT_ID,
  PREMIUM_PRIMARY_VALUE_FEATURES,
  PREMIUM_PRICE_PREVIEW_COPY,
} from '../constants/premium';
import type { PremiumEntitlement } from '../models/premium';
import type { RootStackParamList } from '../navigation/types';
import {
  loadCurrentPremiumEntitlement,
} from '../services/premiumEntitlementService';
import { getPremiumSession, subscribePremiumSession } from '../store';
import { useDelayedVisibility } from '../utils/useDelayedVisibility';

type PremiumScreenProps = NativeStackScreenProps<RootStackParamList, 'Premium'>;

export default function PremiumScreen({ route }: PremiumScreenProps) {
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [entitlement, setEntitlement] = useState<PremiumEntitlement>(getPremiumSession());
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoadingEntitlement, setIsLoadingEntitlement] = useState(true);
  const shouldShowLoadingScreen = useDelayedVisibility(
    isLoadingEntitlement && !hasLoadedOnce
  );
  const highlightedFeature = route.params?.featureId
    ? PREMIUM_FEATURE_COPY[route.params.featureId]
    : null;

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = subscribePremiumSession(setEntitlement);

      const loadEntitlement = async () => {
        if (!hasLoadedOnce) {
          setIsLoadingEntitlement(true);
        }

        try {
          await loadCurrentPremiumEntitlement();
          setHasLoadedOnce(true);
        } finally {
          setIsLoadingEntitlement(false);
        }
      };

      void loadEntitlement();
      return unsubscribe;
    }, [hasLoadedOnce])
  );

  if (shouldShowLoadingScreen) {
    return (
      <ScreenLoadingView
        subtitle="Checking your premium plan and daily limits..."
        title="Loading premium"
      />
    );
  }

  const handlePurchasePress = () => {
    Alert.alert(
      entitlement.isPremium ? 'Premium is active' : 'Premium billing opens in the Play build',
      entitlement.isPremium
        ? 'This account already has premium access from its synced entitlement.'
        : `${PREMIUM_MONTHLY_PRODUCT_ID} is the monthly plan for deeper guidance, weekly shopping insights, Shelf Mode extras, and ad-free ingredient scans.`
    );
  };

  const handleRestorePress = () => {
    Alert.alert(
      'Restore premium',
      'This button will re-check the active monthly premium plan on this account once Google Play billing is live in the release build.'
    );
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Inqoura Premium</Text>
          <Text style={styles.title}>
            {entitlement.isPremium ? 'Premium is active on this account' : 'Scan with deeper guidance'}
          </Text>
          <Text style={styles.subtitle}>
            {highlightedFeature?.description ||
              `Free helps you scan. Premium helps you understand what matters, what to swap, and what your habits are turning into over time. ${PREMIUM_PRICE_PREVIEW_COPY}`}
          </Text>
          <View
            style={[
              styles.statusBadge,
              entitlement.isPremium ? styles.statusBadgeActive : styles.statusBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                entitlement.isPremium
                  ? styles.statusBadgeTextActive
                  : styles.statusBadgeTextInactive,
              ]}
            >
              {entitlement.isPremium
                ? `Active via ${entitlement.source.replace(/-/g, ' ')}`
                : 'Free plan'}
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.sectionTitle}>What free already includes</Text>
          {PREMIUM_FREE_PLAN_FEATURES.map((item) => (
            <View key={item} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.sectionTitle}>What premium adds</Text>
          {PREMIUM_PRIMARY_VALUE_FEATURES.map((item) => (
            <View key={item} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Also included</Text>
          {PREMIUM_BONUS_FEATURES.map((item) => (
            <Text key={item} style={styles.noteText}>
              • {item}
            </Text>
          ))}
        </View>

        {highlightedFeature ? (
          <View style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>Selected premium feature</Text>
            <Text style={styles.highlightTitle}>{highlightedFeature.title}</Text>
            <Text style={styles.highlightText}>{highlightedFeature.description}</Text>
          </View>
        ) : null}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Who premium is for</Text>
          <Text style={styles.noteText}>
            Premium is meant for people who scan often and want clearer explanations, stronger OCR recovery, and weekly shopping feedback instead of just higher limits.
          </Text>
        </View>

        <PrimaryButton
          label={entitlement.isPremium ? 'Premium Active' : 'See Monthly Premium'}
          onPress={handlePurchasePress}
        />
        {!entitlement.isPremium ? (
          <PrimaryButton label="Restore Existing Premium" onPress={handleRestorePress} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    content: {
      gap: 18,
      padding: 24,
    },
    eyebrow: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    featureCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 14,
      padding: 20,
    },
    featureDot: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      height: 10,
      marginTop: 6,
      width: 10,
    },
    featureRow: {
      flexDirection: 'row',
      gap: 12,
    },
    featureText: {
      color: colors.text,
      flex: 1,
      fontFamily: typography.bodyFontFamily,
      fontSize: 15,
      lineHeight: 22,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 18,
      fontWeight: '800',
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 28,
      borderWidth: 1,
      gap: 10,
      padding: 22,
    },
    highlightCard: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
      borderRadius: 22,
      borderWidth: 1,
      gap: 8,
      padding: 18,
    },
    highlightLabel: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    highlightText: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 21,
    },
    highlightTitle: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 19,
      fontWeight: '800',
    },
    noteCard: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 22,
      borderWidth: 1,
      gap: 8,
      padding: 18,
    },
    noteText: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 21,
    },
    noteTitle: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 17,
      fontWeight: '700',
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    statusBadgeActive: {
      backgroundColor: colors.successMuted,
    },
    statusBadgeInactive: {
      backgroundColor: colors.warningMuted,
    },
    statusBadgeText: {
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
    },
    statusBadgeTextActive: {
      color: colors.success,
    },
    statusBadgeTextInactive: {
      color: colors.warning,
    },
    subtitle: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 15,
      lineHeight: 23,
    },
    title: {
      color: colors.text,
      fontFamily: typography.displayFontFamily,
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 36,
    },
  });
