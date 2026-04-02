import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../components/AppThemeProvider';
import DietProfileModal from '../components/DietProfileModal';
import HistoryInsightsCard from '../components/HistoryInsightsCard';
import HistoryNotificationsCard from '../components/HistoryNotificationsCard';
import ProductChangeAlertsCard from '../components/ProductChangeAlertsCard';
import PrimaryButton from '../components/PrimaryButton';
import TrustPromiseCard from '../components/TrustPromiseCard';
import UsualBuysCard, { type UsualBuyCardItem } from '../components/UsualBuysCard';
import {
  DEFAULT_DIET_PROFILE_ID,
  DIET_PROFILE_DEFINITIONS,
  type DietProfileId,
} from '../constants/dietProfiles';
import type { PremiumEntitlement } from '../models/premium';
import type { RootStackParamList } from '../navigation/types';
import {
  loadDietProfileIntroSeen,
  markDietProfileIntroSeen,
  saveDietProfile,
} from '../services/dietProfileStorage';
import { loadAdminAppConfig } from '../services/adminAppConfigService';
import { loadComparisonSession } from '../services/comparisonSessionStorage';
import {
  loadFeatureQuotaSnapshot,
  type FeatureQuotaSnapshot,
} from '../services/featureUsageStorage';
import { loadCurrentPremiumEntitlement } from '../services/premiumEntitlementService';
import { loadProductChangeAlerts } from '../services/productChangeAlertService';
import { loadUsualBuyProducts } from '../services/commonProductStorage';
import { loadEffectiveShoppingProfile } from '../services/householdProfilesService';
import {
  loadScanHistory,
  subscribeScanHistoryChanges,
} from '../services/scanHistoryStorage';
import { loadUserProfile } from '../services/userProfileService';
import { getPremiumSession, subscribeAuthSession, subscribePremiumSession } from '../store';
import {
  buildHistoryNotifications,
  buildHistoryOverview,
  type HistoryInsight,
  type HistoryNotification,
} from '../utils/historyPersonalization';
import type { ProductChangeAlert } from '../models/productChangeAlert';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [selectedProfileId, setSelectedProfileId] = useState<DietProfileId>(
    DEFAULT_DIET_PROFILE_ID
  );
  const [draftProfileId, setDraftProfileId] = useState<DietProfileId>(
    DEFAULT_DIET_PROFILE_ID
  );
  const [adminAnnouncement, setAdminAnnouncement] = useState<{
    body: string | null;
    title: string | null;
  } | null>(null);
  const [historyInsights, setHistoryInsights] = useState<HistoryInsight[]>([]);
  const [historyNotifications, setHistoryNotifications] = useState<HistoryNotification[]>([]);
  const [productChangeAlerts, setProductChangeAlerts] = useState<ProductChangeAlert[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [comparisonSummary, setComparisonSummary] = useState<string | null>(null);
  const [shelfItemCount, setShelfItemCount] = useState(0);
  const [activeShopperName, setActiveShopperName] = useState('You');
  const [isHouseholdProfileActive, setIsHouseholdProfileActive] = useState(false);
  const [isHistoryEnabled, setIsHistoryEnabled] = useState(true);
  const [isIngredientOcrEnabled, setIsIngredientOcrEnabled] = useState(true);
  const [isFirstLaunchProfileFlow, setIsFirstLaunchProfileFlow] = useState(false);
  const [ocrQuotaSnapshot, setOcrQuotaSnapshot] = useState<FeatureQuotaSnapshot | null>(
    null
  );
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [premiumEntitlement, setPremiumEntitlement] = useState<PremiumEntitlement>(
    getPremiumSession()
  );
  const [usualBuys, setUsualBuys] = useState<UsualBuyCardItem[]>([]);

  const selectedProfile =
    DIET_PROFILE_DEFINITIONS.find((profile) => profile.id === selectedProfileId) ||
    DIET_PROFILE_DEFINITIONS[0];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityLabel="Open settings"
          onPress={() => navigation.navigate('Settings')}
          style={({ pressed }) => [
            styles.headerProfileButton,
            pressed && styles.headerProfileButtonPressed,
          ]}
        >
          <Text style={styles.headerProfileButtonText}>Settings</Text>
        </Pressable>
      ),
    });
  }, [navigation, styles, selectedProfileId]);

  useEffect(() => {
    let isMounted = true;

    const refreshPremiumState = async () => {
      const entitlement = await loadCurrentPremiumEntitlement();
      const [
        quotaSnapshot,
        profile,
        historyEntries,
        comparisonSession,
        changeAlerts,
        effectiveShoppingProfile,
        usualBuyProducts,
      ] =
        await Promise.all([
          loadFeatureQuotaSnapshot('ingredient-ocr', entitlement),
          loadUserProfile(),
          loadScanHistory(),
          loadComparisonSession(),
          loadProductChangeAlerts(),
          loadEffectiveShoppingProfile(),
          loadUsualBuyProducts(3),
        ]);

      if (!isMounted) {
        return;
      }

      setPremiumEntitlement(entitlement);
      setOcrQuotaSnapshot(quotaSnapshot);
      setFavoriteCount(profile?.favoriteProductCodes?.length ?? 0);
      setProductChangeAlerts(changeAlerts);
      setSelectedProfileId(effectiveShoppingProfile.dietProfileId);
      setActiveShopperName(effectiveShoppingProfile.name);
      setIsHouseholdProfileActive(effectiveShoppingProfile.usesHouseholdProfile);
      setShelfItemCount(comparisonSession.entries.length);
      const comparisonEntries = comparisonSession.entries;
      setComparisonSummary(
        comparisonEntries.length >= 2
          ? `${comparisonEntries[0].name} vs ${comparisonEntries[1].name}`
          : null
      );
      setUsualBuys(
        usualBuyProducts.map((item) => {
          const matchingHistoryEntry =
            historyEntries.find(
              (entry) =>
                entry.barcode === item.barcode ||
                entry.product.code === item.code ||
                entry.id === item.barcode
            ) ?? null;

          return {
            id: item.code || item.barcode,
            isFavorite: (profile?.favoriteProductCodes ?? []).includes(item.code || item.barcode),
            name: item.name,
            score: matchingHistoryEntry?.score ?? null,
            summary:
              matchingHistoryEntry?.riskSummary ||
              item.product.categories[0] ||
              'Scanned recently',
            usageCount: item.usageCount,
          };
        })
      );
      const historyOverview = buildHistoryOverview(historyEntries, {
        includePremiumPatterns:
          entitlement.isPremium && (profile?.historyInsightsEnabled ?? true),
      });
      setHistoryInsights(historyOverview.insights);
      setHistoryNotifications(
        profile?.historyNotificationsEnabled
          ? buildHistoryNotifications(
              historyEntries,
              profile.historyNotificationCadence ?? 'weekly'
            )
          : []
      );
    };

    const unsubscribe = subscribeAuthSession((session) => {
      void refreshPremiumState();
    });
    const unsubscribePremium = subscribePremiumSession((entitlement) => {
      setPremiumEntitlement(entitlement);
      void refreshPremiumState();
    });
    const unsubscribeHistory = subscribeScanHistoryChanges(() => {
      void refreshPremiumState();
    });

    void refreshPremiumState();

    return () => {
      isMounted = false;
      unsubscribe();
      unsubscribePremium();
      unsubscribeHistory();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreProfile = async () => {
      const [effectiveShoppingProfile, hasSeenIntro] = await Promise.all([
        loadEffectiveShoppingProfile(),
        loadDietProfileIntroSeen(),
      ]);

      if (isMounted) {
        setSelectedProfileId(effectiveShoppingProfile.dietProfileId);
        setDraftProfileId(effectiveShoppingProfile.dietProfileId);
        setActiveShopperName(effectiveShoppingProfile.name);
        setIsHouseholdProfileActive(effectiveShoppingProfile.usesHouseholdProfile);
        setIsFirstLaunchProfileFlow(!hasSeenIntro);
        setIsProfileModalVisible(!hasSeenIntro);
      }
    };

    void restoreProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreAdminConfig = async () => {
      const config = await loadAdminAppConfig();

      if (!isMounted) {
        return;
      }

      setAdminAnnouncement({
        body: config.homeAnnouncementBody,
        title: config.homeAnnouncementTitle,
      });
      setIsHistoryEnabled(config.enableHistory);
      setIsIngredientOcrEnabled(config.enableIngredientOcr);
    };

    void restoreAdminConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplyProfile = async () => {
    setSelectedProfileId(draftProfileId);
    setIsProfileModalVisible(false);
    setIsFirstLaunchProfileFlow(false);
    await saveDietProfile(draftProfileId);
    await markDietProfileIntroSeen();
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.backgroundGlow} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 28, 44) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.heroBlock}>
              <Text style={styles.title}>Scan food fast</Text>
              <Text style={styles.subtitle}>
                Barcode, ingredients, and a clear trust-backed decision in seconds.
              </Text>
            </View>

            {adminAnnouncement?.title || adminAnnouncement?.body ? (
              <View style={styles.announcementCard}>
                <Text style={styles.announcementLabel}>Announcement</Text>
                {adminAnnouncement.title ? (
                  <Text style={styles.announcementTitle}>
                    {adminAnnouncement.title}
                  </Text>
                ) : null}
                {adminAnnouncement.body ? (
                  <Text style={styles.announcementText}>
                    {adminAnnouncement.body}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.profileSummaryCard}>
              <Text style={styles.profileSummaryLabel}>Shopping For</Text>
              <Text style={styles.profileSummaryTitle}>{activeShopperName}</Text>
              <Text style={styles.profileSummaryText}>
                {isHouseholdProfileActive
                  ? `${selectedProfile.label} household profile is active.`
                  : `${selectedProfile.label} is your default shopping profile.`}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Settings')}
                style={styles.inlineAction}
              >
                <Text style={styles.inlineActionText}>Manage Household Profiles</Text>
              </Pressable>
            </View>

            <View style={styles.profileSummaryCard}>
              <Text style={styles.profileSummaryLabel}>Diet Profile</Text>
              <Text style={styles.profileSummaryTitle}>{selectedProfile.label}</Text>
            </View>

            <View style={styles.premiumCard}>
              <View style={styles.premiumCardHeader}>
                <View>
                  <Text style={styles.premiumCardLabel}>Premium</Text>
                  <Text style={styles.premiumCardTitle}>
                    {premiumEntitlement.isPremium
                      ? 'Premium is active on this account'
                      : 'Unlock premium tools'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.premiumBadge,
                    premiumEntitlement.isPremium
                      ? styles.premiumBadgeActive
                      : styles.premiumBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.premiumBadgeText,
                      premiumEntitlement.isPremium
                        ? styles.premiumBadgeTextActive
                        : styles.premiumBadgeTextInactive,
                    ]}
                  >
                    {premiumEntitlement.isPremium ? 'Premium' : 'Basic'}
                  </Text>
                </View>
              </View>
              <Text style={styles.premiumCardText}>
                {premiumEntitlement.isPremium
                  ? 'Deeper guidance, smarter OCR help, and weekly shopping insights are on.'
                  : 'Free covers the core scan. Premium adds deeper guidance and habit help.'}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Premium')}
                style={styles.premiumAction}
              >
                <Text style={styles.premiumActionText}>
                  {premiumEntitlement.isPremium ? 'Manage Premium' : 'Compare Plans'}
                </Text>
              </Pressable>
            </View>

            <TrustPromiseCard compact />

            {isIngredientOcrEnabled && ocrQuotaSnapshot ? (
              <View style={styles.profileSummaryCard}>
                <Text style={styles.profileSummaryLabel}>OCR</Text>
                <Text style={styles.profileSummaryTitle}>
                  {ocrQuotaSnapshot.isUnlimited
                    ? 'Unlimited scans today'
                    : `${ocrQuotaSnapshot.remaining} scan${ocrQuotaSnapshot.remaining === 1 ? '' : 's'} left today`}
                </Text>
              </View>
            ) : null}

            <UsualBuysCard
              items={usualBuys}
              onOpenHistory={() => navigation.navigate('History')}
              onOpenSearch={() => navigation.navigate('Search')}
            />

            {historyInsights.length > 0 ? (
              <HistoryInsightsCard colors={colors} insights={historyInsights} />
            ) : null}

            {historyNotifications.length > 0 ? (
              <HistoryNotificationsCard notifications={historyNotifications} />
            ) : null}

            {productChangeAlerts.length > 0 ? (
              <ProductChangeAlertsCard
                alerts={productChangeAlerts}
                onOpenAlert={() => navigation.navigate('History')}
              />
            ) : null}

            {premiumEntitlement.isPremium && (favoriteCount > 0 || comparisonSummary) ? (
              <View style={styles.profileSummaryCard}>
                <Text style={styles.profileSummaryLabel}>Saved products</Text>
                <Text style={styles.profileSummaryTitle}>
                  {favoriteCount > 0
                    ? `${favoriteCount} favorite${favoriteCount === 1 ? '' : 's'} saved`
                    : 'Comparison ready'}
                </Text>
                {comparisonSummary ? (
                  <Text style={styles.profileSummaryText}>{comparisonSummary}</Text>
                ) : null}
              </View>
            ) : null}

            {shelfItemCount > 0 ? (
              <View style={styles.profileSummaryCard}>
                <Text style={styles.profileSummaryLabel}>Shelf Mode</Text>
                <Text style={styles.profileSummaryTitle}>
                  {shelfItemCount} product{shelfItemCount === 1 ? '' : 's'} ready to compare
                </Text>
                {comparisonSummary ? (
                  <Text style={styles.profileSummaryText}>{comparisonSummary}</Text>
                ) : null}
                <Pressable
                  onPress={() => navigation.navigate('ShelfMode')}
                  style={styles.inlineAction}
                >
                  <Text style={styles.inlineActionText}>Open Shelf Mode</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.footerActions}>
              <PrimaryButton
                label="Open Scanner"
                onPress={() =>
                  navigation.navigate('Scanner', { profileId: selectedProfileId })
                }
              />
              <Pressable
                onPress={() => navigation.navigate('Search')}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>Search Products</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('ShelfMode')}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>Open Shelf Mode</Text>
              </Pressable>
              {isIngredientOcrEnabled ? (
                <Pressable
                  onPress={() =>
                    navigation.navigate('IngredientOcr', {
                      profileId: selectedProfileId,
                    })
                  }
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>
                    {ocrQuotaSnapshot?.isUnlimited
                      ? 'Scan Ingredient Label'
                      : `Scan Ingredient Label${
                          ocrQuotaSnapshot ? ` (${ocrQuotaSnapshot.remaining} left)` : ''
                        }`}
                  </Text>
                </Pressable>
              ) : null}
              {isHistoryEnabled ? (
                <Pressable
                  onPress={() => navigation.navigate('History')}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>View Scan History</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => navigation.navigate('Settings')}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>Open Settings</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
      <DietProfileModal
        isFirstLaunch={isFirstLaunchProfileFlow}
        onApply={() => void handleApplyProfile()}
        onSelect={setDraftProfileId}
        selectedProfileId={draftProfileId}
        visible={isProfileModalVisible}
      />
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
  announcementCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  announcementLabel: {
    color: colors.primary,
    fontFamily: typography.accentFontFamily,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  announcementText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFontFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  announcementTitle: {
    color: colors.text,
    fontFamily: typography.headingFontFamily,
    fontSize: 18,
    fontWeight: '700',
  },
  backgroundGlow: {
    backgroundColor: colors.primaryMuted,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    height: 240,
    left: -24,
    opacity: 0.55,
    position: 'absolute',
    right: -24,
    top: -32,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  content: {
    gap: 24,
  },
  footerActions: {
    gap: 12,
    marginTop: 4,
  },
  heroBlock: {
    gap: 14,
    paddingTop: 8,
  },
  headerProfileButton: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerProfileButtonPressed: {
    opacity: 0.86,
  },
  headerProfileButtonText: {
    color: colors.primary,
    fontFamily: typography.accentFontFamily,
    fontSize: 12,
    fontWeight: '800',
  },
  inlineAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineActionText: {
    color: colors.primary,
    fontFamily: typography.accentFontFamily,
    fontSize: 13,
    fontWeight: '800',
  },
  profileSummaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  profileSummaryLabel: {
    color: colors.primary,
    fontFamily: typography.accentFontFamily,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  profileSummaryText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFontFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  profileSummaryTitle: {
    color: colors.text,
    fontFamily: typography.headingFontFamily,
    fontSize: 20,
    fontWeight: '700',
  },
  premiumAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  premiumActionText: {
    color: colors.primary,
    fontFamily: typography.accentFontFamily,
    fontSize: 13,
    fontWeight: '800',
  },
  premiumBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  premiumBadgeActive: {
    backgroundColor: colors.successMuted,
  },
  premiumBadgeInactive: {
    backgroundColor: colors.warningMuted,
  },
  premiumBadgeText: {
    fontFamily: typography.accentFontFamily,
    fontSize: 12,
    fontWeight: '800',
  },
  premiumBadgeTextActive: {
    color: colors.success,
  },
  premiumBadgeTextInactive: {
    color: colors.warning,
  },
  premiumCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  premiumCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  premiumCardLabel: {
    color: colors.primary,
    fontFamily: typography.accentFontFamily,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  premiumCardText: {
    color: colors.textMuted,
    fontFamily: typography.bodyFontFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  premiumCardTitle: {
    color: colors.text,
    fontFamily: typography.headingFontFamily,
    fontSize: 18,
    fontWeight: '700',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  secondaryAction: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryActionText: {
    color: colors.primary,
    fontFamily: typography.accentFontFamily,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyFontFamily,
    fontSize: 17,
    lineHeight: 25,
  },
  title: {
    color: colors.text,
    fontFamily: typography.displayFontFamily,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
});
