import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';

import HeroCard from '../../components/HeroCard';
import PageStateCard from '../../components/PageStateCard';
import { useI18n } from '../../components/AppLanguageProvider';
import FeaturePageLayout from '../../components/FeaturePageLayout';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenReveal from '../../components/ScreenReveal';
import SectionHeader from '../../components/SectionHeader';
import SubscriptionOptionCard from '../../components/SubscriptionOptionCard';
import { useAppTheme } from '../../components/AppThemeProvider';
import {
  PREMIUM_FEATURE_COPY,
  PREMIUM_PRIMARY_VALUE_FEATURES,
  PREMIUM_PRICE_PREVIEW_COPY,
} from '../../constants/premium';
import {
  createDefaultPremiumEntitlement,
  type PremiumEntitlement,
  type PremiumFeatureId,
} from '../../models/premium';
import type { RootStackParamList } from '../../navigation/types';
import { trackAnalyticsEvent } from '../../services/analyticsService';
import { recordNonFatalError } from '../../services/appMonitoringService';
import type { RevenueCatPackageOption } from '../../services/revenueCatService';
import {
  getRevenueCatErrorMessage,
  getRevenueCatPremiumState,
  isRevenueCatAvailable,
  isRevenueCatNetworkError,
  isRevenueCatPurchaseCancelled,
  loadRevenueCatCustomerInfo,
  loadRevenueCatOfferings,
  loadRevenueCatPackageOptions,
  presentRevenueCatCustomerCenter,
  presentRevenueCatPaywall,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from '../../services/revenueCatService';
import { loadSessionPremiumEntitlement } from '../../services/sessionDataService';
import {
  readSessionResourceCache,
  SESSION_CACHE_KEYS,
} from '../../services/sessionResourceCache';
import { getPremiumSession, subscribePremiumSession } from '../../store';

type PremiumScreenProps = NativeStackScreenProps<RootStackParamList, 'Premium'>;

type PremiumContentProps = {
  featureId?: PremiumFeatureId;
};

function PremiumContent({ featureId }: PremiumContentProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const cachedEntitlement = readSessionResourceCache<PremiumEntitlement>(
    SESSION_CACHE_KEYS.premiumEntitlement
  );
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [entitlement, setEntitlement] = useState<PremiumEntitlement>(
    cachedEntitlement ?? getPremiumSession()
  );
  const [hasLoadedBillingOnce, setHasLoadedBillingOnce] = useState(false);
  const [isRefreshingPremium, setIsRefreshingPremium] = useState(false);
  const [isOfflineStateVisible, setIsOfflineStateVisible] = useState(false);
  const [packageOptions, setPackageOptions] = useState<RevenueCatPackageOption[]>([]);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const hasTrackedPremiumViewRef = useRef(false);
  const highlightedFeature = featureId ? PREMIUM_FEATURE_COPY[featureId] : null;
  const revenueCatAvailable = isRevenueCatAvailable();
  const billingState = getRevenueCatPremiumState(customerInfo);
  const activeProductLabel =
    entitlement.billingProductIdentifier || billingState.productIdentifier || null;
  const hasBillingAccess = revenueCatAvailable && packageOptions.length > 0;
  const billingPlaceholderCopy = useMemo(() => {
    if (!revenueCatAvailable) {
      return {
        subtitle: t(
          'Billing is not configured in this build yet. Add the RevenueCat Android key and rebuild the app.'
        ),
        title: t('Billing setup needed'),
      };
    }

    if (!currentOffering) {
      return {
        subtitle: t(
          'Plans are not available on this device yet. Open the Play test build for this account and try again.'
        ),
        title: t('Plans not available yet'),
      };
    }

    return {
      subtitle: t('We could not load plans on this device right now. Try again in a moment.'),
      title: t('Plans will appear here soon'),
    };
  }, [currentOffering, revenueCatAvailable, t]);
  const sheetTitle = t(entitlement.isPremium ? 'Membership' : 'Premium');
  const sheetSubtitle = isOfflineStateVisible
    ? t('Reconnect to refresh plans and verify your subscription.')
    : highlightedFeature?.shortLabel
      ? `${highlightedFeature.shortLabel} highlighted`
      : entitlement.isPremium
        ? t('Billing, restores, and access live here.')
        : `${t('Upgrade only when you want deeper shopper guidance.')} ${PREMIUM_PRICE_PREVIEW_COPY}`;

  const loadPremiumState = useCallback(async () => {
    const latestCustomerInfo = await loadRevenueCatCustomerInfo();
    const [latestEntitlement, latestOffering] = await Promise.all([
      loadSessionPremiumEntitlement('stale-while-revalidate'),
      loadRevenueCatOfferings(),
    ]);
    const nextPackageOptions = await loadRevenueCatPackageOptions(
      latestOffering,
      latestCustomerInfo
    );
    const nextEntitlement = latestEntitlement ?? createDefaultPremiumEntitlement();

    setCustomerInfo(latestCustomerInfo);
    setCurrentOffering(latestOffering);
    setEntitlement(nextEntitlement);
    setPackageOptions(nextPackageOptions);
    setHasLoadedBillingOnce(true);
    setIsOfflineStateVisible(false);
  }, []);

  const refreshPremiumState = useCallback(
    async () => {
      setIsRefreshingPremium(true);
      try {
        await loadPremiumState();
      } catch (error) {
        if (isRevenueCatNetworkError(error)) {
          setIsOfflineStateVisible(true);
          setHasLoadedBillingOnce(true);
          return;
        }

        Alert.alert(
          t('Premium unavailable'),
          t(getRevenueCatErrorMessage(error, 'We could not load premium right now.'))
        );
      } finally {
        setIsRefreshingPremium(false);
      }
    },
    [loadPremiumState, t]
  );

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribePremiumSession((nextEntitlement) => {
      if (isMounted) {
        setEntitlement(nextEntitlement ?? createDefaultPremiumEntitlement());
      }
    });

    void refreshPremiumState();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [refreshPremiumState]);

  useEffect(() => {
    if (hasTrackedPremiumViewRef.current) {
      return;
    }

    hasTrackedPremiumViewRef.current = true;
    trackAnalyticsEvent('premium_viewed', {
      featureId: featureId ?? 'general',
      premiumState: entitlement.isPremium ? 'premium' : 'free',
    });
  }, [entitlement.isPremium, featureId]);

  const handlePurchasePackage = async (selectedPackage: RevenueCatPackageOption) => {
    setPendingActionId(selectedPackage.id);
    trackAnalyticsEvent('premium_purchase_started', {
      packageId: selectedPackage.id,
      productIdentifier: selectedPackage.productIdentifier,
    });

    try {
      await purchaseRevenueCatPackage(selectedPackage.packageRef);
      await loadPremiumState();
      trackAnalyticsEvent('premium_purchase_succeeded', {
        packageId: selectedPackage.id,
        productIdentifier: selectedPackage.productIdentifier,
      });
      Alert.alert(
        t('Premium updated'),
        t('{plan} is now active.', { plan: selectedPackage.title })
      );
    } catch (error) {
      if (!isRevenueCatPurchaseCancelled(error)) {
        trackAnalyticsEvent('premium_purchase_failed', {
          packageId: selectedPackage.id,
          productIdentifier: selectedPackage.productIdentifier,
        });
        recordNonFatalError('premium.purchase', error, {
          packageId: selectedPackage.id,
          productIdentifier: selectedPackage.productIdentifier,
        });
      }
      if (!isRevenueCatPurchaseCancelled(error)) {
        Alert.alert(
          t('Purchase failed'),
          t(getRevenueCatErrorMessage(error, 'We could not start that subscription right now.'))
        );
      }
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <FeaturePageLayout
      footerInset={120}
      subtitle={sheetSubtitle}
      title={sheetTitle}
    >
      {isOfflineStateVisible ? (
        <View style={styles.flow}>
          <PageStateCard
            icon="cloud-offline-outline"
            subtitle={t('Premium plans need internet to verify your subscription and load offers.')}
            title={t('Premium needs a connection')}
          />
          <PrimaryButton label={t('Try Again')} onPress={() => void refreshPremiumState()} />
        </View>
      ) : (
        <View style={styles.flow}>
          <ScreenReveal delayMs={10}>
            <HeroCard
              subtitle={
                entitlement.isPremium
                  ? t('Manage billing, restores, and access from one place.')
                  : highlightedFeature?.description ||
                    `${t('Upgrade only when you want richer guidance and cleaner plan controls.')} ${PREMIUM_PRICE_PREVIEW_COPY}`
              }
              title={t(
                entitlement.isPremium ? 'Plan active' : 'Upgrade when you want more help'
              )}
            >
              <View style={styles.statusRow}>
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
                    {entitlement.isPremium ? t('Active') : t('Free plan')}
                  </Text>
                </View>
                {activeProductLabel ? (
                  <View style={styles.planPill}>
                    <Text numberOfLines={2} style={styles.planPillText}>
                      {activeProductLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            </HeroCard>
          </ScreenReveal>

          {highlightedFeature ? (
            <ScreenReveal delayMs={40}>
              <PageStateCard
                icon="sparkles-outline"
                subtitle={highlightedFeature.description}
                title={highlightedFeature.title}
                tone="accent"
              />
            </ScreenReveal>
          ) : null}

          <ScreenReveal delayMs={70}>
            <SectionHeader title={t('Included')} />
          </ScreenReveal>
          <ScreenReveal delayMs={90}>
            <View style={styles.featureCard}>
              {PREMIUM_PRIMARY_VALUE_FEATURES.slice(0, 3).map((item) => (
                <View key={item} style={styles.featureRow}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>{t(item)}</Text>
                </View>
              ))}
            </View>
          </ScreenReveal>

          {packageOptions.length > 0 ? (
            <ScreenReveal delayMs={120}>
              <View style={styles.subscriptionSection}>
                <SectionHeader
                  subtitle={
                    entitlement.isPremium
                      ? t('Review or change your current plan.')
                      : t('Pick a plan any time.')
                  }
                  title={t('Plans')}
                />
                {packageOptions.map((option) => (
                  <SubscriptionOptionCard
                    key={option.id}
                    badge={option.id === 'yearly' ? t('Best value') : undefined}
                    buttonLabel={t('Choose {plan}', { plan: option.title })}
                    description={option.description}
                    disabled={Boolean(pendingActionId)}
                    isCurrent={option.productIdentifier === activeProductLabel}
                    onPress={() => void handlePurchasePackage(option)}
                    periodLabel={option.periodLabel}
                    priceLabel={option.priceLabel}
                    title={option.title}
                  />
                ))}
              </View>
            </ScreenReveal>
          ) : (
            <ScreenReveal delayMs={120}>
              <View style={styles.billingCard}>
                <Text style={styles.sectionTitle}>
                  {isRefreshingPremium && !hasLoadedBillingOnce
                    ? t('Loading plans')
                    : billingPlaceholderCopy.title}
                </Text>
                <Text style={styles.billingWarning}>
                  {isRefreshingPremium && !hasLoadedBillingOnce
                    ? t('Checking your current access and available plans now.')
                    : billingPlaceholderCopy.subtitle}
                </Text>
              </View>
            </ScreenReveal>
          )}

          <ScreenReveal delayMs={150}>
            <View style={styles.actionsCard}>
              <SectionHeader
                subtitle={t('Restore or manage purchases from here.')}
                title={t('Actions')}
              />
              <View style={styles.buttonStack}>
              <PrimaryButton
                disabled={!hasBillingAccess || Boolean(pendingActionId)}
                label={t(entitlement.isPremium ? 'See Plans' : 'View Plans')}
                onPress={() => {
                  setPendingActionId('paywall');
                  void presentRevenueCatPaywall(currentOffering)
                    .then(loadPremiumState)
                    .catch((error) => {
                      Alert.alert(
                        t('Paywall unavailable'),
                        t(
                          getRevenueCatErrorMessage(
                            error,
                            'We could not open premium checkout right now.'
                          )
                        )
                      );
                    })
                    .finally(() => setPendingActionId(null));
                }}
              />
              <PrimaryButton
                disabled={!revenueCatAvailable || Boolean(pendingActionId)}
                label={t('Restore Purchases')}
                onPress={() => {
                  setPendingActionId('restore');
                  trackAnalyticsEvent('premium_restore_started');
                  void restoreRevenueCatPurchases()
                    .then(async (restoredCustomerInfo) => {
                      await loadPremiumState();
                      trackAnalyticsEvent('premium_restore_succeeded', {
                        premiumState: getRevenueCatPremiumState(restoredCustomerInfo).isActive
                          ? 'premium'
                          : 'free',
                      });
                      Alert.alert(
                        t('Restore complete'),
                        getRevenueCatPremiumState(restoredCustomerInfo).isActive
                          ? t('Your premium access is active again.')
                          : t('No active premium subscription was found on this store account.')
                      );
                    })
                    .catch((error) => {
                      trackAnalyticsEvent('premium_restore_failed');
                      recordNonFatalError('premium.restore', error);
                      Alert.alert(
                        t('Restore failed'),
                        t(getRevenueCatErrorMessage(error, 'We could not restore purchases right now.'))
                      );
                    })
                    .finally(() => setPendingActionId(null));
                }}
              />
              {(entitlement.isPremium || billingState.managementUrl) && revenueCatAvailable ? (
                <PrimaryButton
                  disabled={Boolean(pendingActionId)}
                  label={t('Manage Plan')}
                  onPress={() => {
                    setPendingActionId('customer-center');
                    void presentRevenueCatCustomerCenter()
                      .then(loadPremiumState)
                      .catch((error) => {
                        Alert.alert(
                          t('Customer Center unavailable'),
                          t(
                            getRevenueCatErrorMessage(
                              error,
                              'We could not open subscription management right now.'
                            )
                          )
                        );
                      })
                    .finally(() => setPendingActionId(null));
                  }}
                />
              ) : null}
              </View>
            </View>
          </ScreenReveal>
        </View>
      )}
    </FeaturePageLayout>
  );
}

export default function PremiumScreen({ route }: PremiumScreenProps) {
  return <PremiumContent featureId={route.params?.featureId} />;
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    actionsCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 14,
      padding: 18,
    },
    billingCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 8,
      padding: 18,
    },
    billingWarning: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 21,
    },
    buttonStack: {
      gap: 10,
    },
    featureCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 12,
      padding: 18,
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
      fontSize: 14,
      lineHeight: 21,
    },
    flow: {
      gap: 14,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 18,
      fontWeight: '800',
    },
    planPill: {
      backgroundColor: colors.primaryMuted,
      borderRadius: 999,
      flexShrink: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    planPillText: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 16,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    statusBadgeActive: {
      backgroundColor: colors.primaryMuted,
    },
    statusBadgeInactive: {
      backgroundColor: colors.background,
    },
    statusBadgeText: {
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    statusBadgeTextActive: {
      color: colors.primary,
    },
    statusBadgeTextInactive: {
      color: colors.textMuted,
    },
    statusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    subscriptionSection: {
      gap: 12,
    },
  });
