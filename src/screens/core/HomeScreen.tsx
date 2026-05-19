import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ActionCard from '../../components/ActionCard';
import FeaturePageLayout from '../../components/FeaturePageLayout';
import HeroCard from '../../components/HeroCard';
import PageStateCard from '../../components/PageStateCard';
import ScreenReveal from '../../components/ScreenReveal';
import SectionHeader from '../../components/SectionHeader';
import { useI18n } from '../../components/AppLanguageProvider';
import { useAppTheme } from '../../components/AppThemeProvider';
import { createDefaultPremiumEntitlement } from '../../models/premium';
import type { RootStackParamList } from '../../navigation/types';
import { measurePerformanceTrace } from '../../services/performanceTrace';
import {
  loadSessionEffectiveShoppingProfile,
  loadSessionPremiumEntitlement,
  loadSessionScanHistory,
} from '../../services/sessionDataService';
import {
  subscribeScanHistoryChanges,
  type ScanHistoryEntry,
} from '../../services/scanHistoryStorage';
import {
  readSessionResourceCache,
  SESSION_CACHE_KEYS,
} from '../../services/sessionResourceCache';
import type { EffectiveShoppingProfile } from '../../services/householdProfilesService';
import { getAuthSession, subscribeAuthSession } from '../../store';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type HomeLoadPolicy = 'cache-first' | 'stale-while-revalidate';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const cachedHistoryEntries = readSessionResourceCache<ScanHistoryEntry[]>(
    SESSION_CACHE_KEYS.scanHistory
  );
  const cachedPremiumEntitlement = readSessionResourceCache<{ isPremium: boolean }>(
    SESSION_CACHE_KEYS.premiumEntitlement
  );
  const cachedShoppingProfile = readSessionResourceCache<EffectiveShoppingProfile>(
    SESSION_CACHE_KEYS.effectiveShoppingProfile
  );
  const [authSession, setAuthSession] = useState(getAuthSession());
  const [recentEntry, setRecentEntry] = useState<ScanHistoryEntry | null>(
    cachedHistoryEntries?.[0] ?? null
  );
  const [profileName, setProfileName] = useState(cachedShoppingProfile?.name || 'You');
  const [isPremium, setIsPremium] = useState(
    (cachedPremiumEntitlement ?? createDefaultPremiumEntitlement()).isPremium
  );
  const [hasLoadedHome, setHasLoadedHome] = useState(
    Boolean(cachedHistoryEntries || cachedPremiumEntitlement || cachedShoppingProfile)
  );
  const [hasMeasuredReady, setHasMeasuredReady] = useState(false);

  useEffect(() => subscribeAuthSession(setAuthSession), []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadHome = async (policy?: HomeLoadPolicy) => {
        const nextPolicy =
          policy ?? (hasLoadedHome ? 'stale-while-revalidate' : 'cache-first');
        const [historyEntries, premiumEntitlement, shoppingProfile] = await Promise.all([
          loadSessionScanHistory(nextPolicy),
          loadSessionPremiumEntitlement(nextPolicy),
          loadSessionEffectiveShoppingProfile(nextPolicy),
        ]);

        if (!isMounted) {
          return;
        }

        setRecentEntry(historyEntries[0] ?? null);
        setIsPremium((premiumEntitlement ?? createDefaultPremiumEntitlement()).isPremium);
        setProfileName(shoppingProfile.name || 'You');
        setHasLoadedHome(true);

        if (!hasMeasuredReady) {
          measurePerformanceTrace('app-start', 'home-ready');
          setHasMeasuredReady(true);
        }
      };

      const unsubscribeHistory = subscribeScanHistoryChanges(() => {
        void loadHome('stale-while-revalidate');
      });

      void loadHome(hasLoadedHome ? 'stale-while-revalidate' : 'cache-first');

      return () => {
        isMounted = false;
        unsubscribeHistory();
      };
    }, [hasLoadedHome, hasMeasuredReady])
  );

  return (
    <FeaturePageLayout
      eyebrow={t('Coach')}
      subtitle={t('Scan quickly, reopen recent results, and keep the next step clear.')}
      title={t('Ready for your next product?')}
    >
      <ScreenReveal delayMs={10}>
        <HeroCard
          eyebrow={t(authSession.status === 'authenticated' ? 'Signed in' : 'Guest mode')}
          subtitle={
            authSession.status === 'authenticated'
              ? t(
                  isPremium
                    ? 'Shopping for {name}. Premium is active whenever you need it.'
                    : 'Shopping for {name}. Premium is available whenever you need it.',
                  { name: profileName }
                )
              : t('You can scan right away. Add an account later for sync and premium.')
          }
          title={t('Scan first. Decide faster.')}
        >
          <Pressable
            accessibilityRole="button"
            android_ripple={{ color: colors.primaryMuted }}
            onPress={() => navigation.navigate('Scanner')}
            style={({ pressed }) => [
              styles.scanHeroButton,
              pressed && styles.scanHeroButtonPressed,
            ]}
          >
            <View style={styles.scanHeroButtonCopy}>
              <Text style={styles.scanHeroButtonLabel}>{t('Scan now')}</Text>
              <Text style={styles.scanHeroButtonHint}>
                {t('Open the camera and check a product instantly.')}
              </Text>
            </View>
            <View style={styles.scanHeroButtonIconWrap}>
              <Ionicons color={colors.primary} name="scan-outline" size={22} />
            </View>
          </Pressable>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaPill}>
              <Text style={styles.heroMetaLabel}>{t('Shopper')}</Text>
              <Text style={styles.heroMetaValue}>{profileName}</Text>
            </View>
            <View style={styles.heroMetaPill}>
              <Text style={styles.heroMetaLabel}>{t('Plan')}</Text>
              <Text style={styles.heroMetaValue}>{t(isPremium ? 'Premium' : 'Free')}</Text>
            </View>
          </View>
        </HeroCard>
      </ScreenReveal>

      <ScreenReveal delayMs={40}>
        <SectionHeader
          subtitle={t('Keep momentum without hunting through the app.')}
          title={t('Continue')}
        />
      </ScreenReveal>

      {recentEntry ? (
        <ScreenReveal delayMs={70}>
          <ActionCard
            badge={t('Resume')}
            icon="return-up-forward-outline"
            onPress={() =>
              navigation.navigate('Result', {
                barcode: recentEntry.barcode,
                barcodeType: recentEntry.barcodeType,
                persistToHistory: false,
                product: recentEntry.product,
                profileId: recentEntry.profileId,
              })
            }
            subtitle={`${recentEntry.riskSummary} · ${recentEntry.score ?? t('No score')} / 100`}
            title={t('Open {name}', { name: recentEntry.name })}
          />
        </ScreenReveal>
      ) : (
        <ScreenReveal delayMs={70}>
          <PageStateCard
            icon="sparkles-outline"
            subtitle={
              hasLoadedHome
                ? t('Your first result will land here so you can reopen it in one tap.')
                : t('Recent scans will appear here as soon as your local history is ready.')
            }
            title={t(hasLoadedHome ? 'No recent scans yet' : 'Loading your latest scan')}
            tone="accent"
          />
        </ScreenReveal>
      )}

      <ScreenReveal delayMs={100}>
        {recentEntry ? (
          <PageStateCard
            icon="pulse-outline"
            subtitle={t(
              'Latest read: {riskSummary}. Reopen it or scan something better next.',
              { riskSummary: recentEntry.riskSummary }
            )}
            title={t('Current focus: {name}', { name: recentEntry.name })}
            tone="accent"
          />
        ) : !hasLoadedHome ? (
          <PageStateCard
            icon="time-outline"
            subtitle={t('We are warming up your plan and shopping profile in the background.')}
            title={t('Getting your shopper tools ready')}
            tone="accent"
          />
        ) : !isPremium ? (
          <PageStateCard
            icon="sparkles-outline"
            subtitle={t(
              'Premium adds clearer explanations and membership tools without changing product scores.'
            )}
            title={t('Premium is ready when you need more detail')}
            tone="accent"
          />
        ) : (
          <PageStateCard
            icon="checkmark-circle-outline"
            subtitle={t(
              'This account already has premium explanations and membership tools unlocked.'
            )}
            title={t('Premium is active')}
            tone="accent"
          />
        )}
      </ScreenReveal>

      <ScreenReveal delayMs={130}>
        <SectionHeader
          subtitle={t('History and account are the main supporting pages from here.')}
          title={t('Quick access')}
        />
      </ScreenReveal>

      <ScreenReveal delayMs={160}>
        <ActionCard
          badge={t('Timeline')}
          icon="time-outline"
          onPress={() => navigation.navigate('History')}
          subtitle={t('Reopen results, search recent scans, or clean up entries.')}
          title={t('Review your history')}
        />
      </ScreenReveal>

      <ScreenReveal delayMs={190}>
        <ActionCard
          badge={t(isPremium ? 'Account' : 'Premium')}
          icon={isPremium ? 'person-circle-outline' : 'sparkles-outline'}
          onPress={() => navigation.navigate(isPremium ? 'Account' : 'Premium')}
          subtitle={
            isPremium
              ? authSession.status === 'authenticated'
                ? t('Open premium, preferences, support, and account tools from one place.')
                : t('Sign in later, manage language, or open support from one place.')
              : t(
                  'See plans, understand membership benefits, and upgrade only when you want more help.'
                )
          }
          title={t(
            isPremium
              ? authSession.status === 'authenticated'
                ? 'Open your account'
                : 'Open account'
              : 'See premium plans'
          )}
        />
      </ScreenReveal>
    </FeaturePageLayout>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    heroMetaLabel: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 12,
    },
    heroMetaPill: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 2,
      minWidth: 92,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    heroMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    heroMetaValue: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 15,
      fontWeight: '800',
    },
    scanHeroButton: {
      alignItems: 'center',
      backgroundColor: colors.text,
      borderRadius: 22,
      flexDirection: 'row',
      gap: 14,
      justifyContent: 'space-between',
      overflow: 'hidden',
      paddingHorizontal: 18,
      paddingVertical: 18,
    },
    scanHeroButtonCopy: {
      flex: 1,
      gap: 4,
    },
    scanHeroButtonHint: {
      color: colors.surface,
      fontFamily: typography.bodyFontFamily,
      fontSize: 13,
      lineHeight: 18,
      opacity: 0.84,
    },
    scanHeroButtonIconWrap: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    scanHeroButtonLabel: {
      color: colors.surface,
      fontFamily: typography.headingFontFamily,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 24,
    },
    scanHeroButtonPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
  });
