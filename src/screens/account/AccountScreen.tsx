import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { APP_NAME } from '../../constants/branding';
import { createDefaultPremiumEntitlement } from '../../models/premium';
import type { UserProfile } from '../../models/userProfile';
import type { RootStackParamList } from '../../navigation/types';
import { measurePerformanceTrace } from '../../services/performanceTrace';
import {
  readSessionResourceCache,
  SESSION_CACHE_KEYS,
} from '../../services/sessionResourceCache';
import {
  getAuthSession,
  subscribeAuthSession,
} from '../../store';
import {
  loadSessionPremiumEntitlement,
  loadSessionUserProfile,
} from '../../services/sessionDataService';

type AccountScreenProps = NativeStackScreenProps<RootStackParamList, 'Account'>;

function buildAccountSummary(
  authSession: ReturnType<typeof getAuthSession>,
  profile: UserProfile | null,
  entitlement: { isPremium: boolean } | null
) {
  if (authSession.status !== 'authenticated') {
    return {
      email: '',
      name: APP_NAME,
      premiumLabel: 'Guest',
    };
  }

  return {
    email: profile?.email ?? authSession.user?.email ?? '',
    name:
      profile?.name?.trim() ||
      authSession.user?.displayName?.trim() ||
      authSession.user?.email ||
      APP_NAME,
    premiumLabel: entitlement?.isPremium ? 'Premium' : 'Basic',
  };
}

export default function AccountScreen({ navigation }: AccountScreenProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const cachedProfile = readSessionResourceCache<UserProfile | null>(
    SESSION_CACHE_KEYS.userProfile
  );
  const cachedPremiumEntitlement = readSessionResourceCache<{ isPremium: boolean }>(
    SESSION_CACHE_KEYS.premiumEntitlement
  );
  const [authSession, setAuthSession] = useState(getAuthSession());
  const [summary, setSummary] = useState(() =>
    buildAccountSummary(
      getAuthSession(),
      cachedProfile,
      cachedPremiumEntitlement ?? createDefaultPremiumEntitlement()
    )
  );
  const [hasMeasuredReady, setHasMeasuredReady] = useState(false);
  const isAuthenticated = authSession.status === 'authenticated';

  useEffect(() => subscribeAuthSession(setAuthSession), []);

  useEffect(() => {
    setSummary((currentSummary) => ({
      ...currentSummary,
      ...buildAccountSummary(authSession, cachedProfile, cachedPremiumEntitlement),
    }));
  }, [authSession, cachedPremiumEntitlement, cachedProfile]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      if (!isAuthenticated) {
        setSummary(buildAccountSummary(authSession, null, null));

        if (!hasMeasuredReady) {
          measurePerformanceTrace('app-start', 'account-ready', {
            authState: 'guest',
          });
          setHasMeasuredReady(true);
        }

        return () => {
          isMounted = false;
        };
      }

      void Promise.all([
        loadSessionUserProfile('stale-while-revalidate'),
        loadSessionPremiumEntitlement('stale-while-revalidate'),
      ])
        .then(([profile, entitlement]) => {
          if (!isMounted) {
            return;
          }

          setSummary(buildAccountSummary(authSession, profile, entitlement));

          if (!hasMeasuredReady) {
            measurePerformanceTrace('app-start', 'account-ready', {
              authState: 'authenticated',
            });
            setHasMeasuredReady(true);
          }
        })
        .catch(() => {
          if (!isMounted) {
            return;
          }

          setSummary(buildAccountSummary(authSession, null, null));

          if (!hasMeasuredReady) {
            measurePerformanceTrace('app-start', 'account-ready', {
              authState: 'authenticated-fallback',
            });
            setHasMeasuredReady(true);
          }
        });

      return () => {
        isMounted = false;
      };
    }, [authSession, hasMeasuredReady, isAuthenticated])
  );

  return (
    <FeaturePageLayout
      eyebrow={t('Account')}
      subtitle={
        isAuthenticated
          ? t('Membership, preferences, support, and account actions live here.')
          : t(
              'Scan freely without an account, then sign in later only when you want sync or premium.'
            )
      }
      title={t(isAuthenticated ? 'Your account' : 'Account is optional')}
    >
      <ScreenReveal delayMs={10}>
        <HeroCard
          eyebrow={t(isAuthenticated ? summary.premiumLabel : 'Guest mode')}
          subtitle={
            isAuthenticated
              ? summary.email || t('Signed in and ready to sync')
              : t('Use an account only for sync, premium, and backup across devices.')
          }
          title={isAuthenticated ? summary.name : t('Scan first, sign in later')}
        >
          {isAuthenticated ? (
            <View style={styles.identityMetaRow}>
              <View style={styles.identityMetaPill}>
                <Text style={styles.identityMetaLabel}>{t('Plan')}</Text>
                <Text style={styles.identityMetaValue}>{t(summary.premiumLabel)}</Text>
              </View>
              <View style={styles.identityMetaPill}>
                <Text style={styles.identityMetaLabel}>{t('Access')}</Text>
                <Text style={styles.identityMetaValue}>{t('All settings here')}</Text>
              </View>
            </View>
          ) : (
            <PageStateCard
              icon="person-add-outline"
              subtitle={t(
                'Sign in only when you want synced history, household settings, and premium across devices.'
              )}
              title={t('Guest mode stays fully usable')}
              tone="accent"
            />
          )}
        </HeroCard>
      </ScreenReveal>

      {isAuthenticated ? (
        <>
          <ScreenReveal delayMs={40}>
            <SectionHeader
              subtitle={t(
                'Membership, appearance, notifications, and household settings live here.'
              )}
              title={t('Membership and preferences')}
            />
          </ScreenReveal>
          <ScreenReveal delayMs={70}>
            <ActionCard
            badge={t('Premium')}
            icon="sparkles-outline"
            onPress={() => navigation.navigate('Premium')}
            subtitle={t(
              'Manage plans, restore access, and keep premium benefits easy to understand.'
            )}
            title={t('Premium')}
          />
          </ScreenReveal>
          <ScreenReveal delayMs={100}>
            <ActionCard
            badge={t('Appearance')}
            icon="color-palette-outline"
            onPress={() => navigation.navigate('AppearanceSettings')}
            subtitle={t('Theme, language, and share-card style all live together.')}
            title={t('Appearance')}
          />
          </ScreenReveal>
          <ScreenReveal delayMs={130}>
            <ActionCard
            badge={t('Notifications')}
            icon="notifications-outline"
            onPress={() => navigation.navigate('NotificationSettings')}
            subtitle={t('Review reminder pace, permission status, and history nudges.')}
            title={t('Notifications')}
          />
          </ScreenReveal>
          <ScreenReveal delayMs={160}>
            <ActionCard
            badge={t('Household')}
            icon="people-outline"
            onPress={() => navigation.navigate('HouseholdSettings')}
            subtitle={t('Tune shopping profiles, food filters, and household fit preferences.')}
            title={t('Household')}
          />
          </ScreenReveal>
          <ScreenReveal delayMs={190}>
            <SectionHeader
              subtitle={t('Support, legal, and account actions are kept here.')}
              title={t('Support and tools')}
            />
          </ScreenReveal>
          <ScreenReveal delayMs={220}>
            <ActionCard
            badge={t('Support')}
            icon="help-buoy-outline"
            onPress={() => navigation.navigate('SupportSettings')}
            subtitle={t('Open help, privacy, feedback, and about from one place.')}
            title={t('Support')}
          />
          </ScreenReveal>
          <ScreenReveal delayMs={250}>
            <ActionCard
            badge={t('Account tools')}
            icon="person-circle-outline"
            onPress={() => navigation.navigate('AccountSettings')}
            subtitle={t('Log out, delete your account, or open account-only actions.')}
            title={t('Account tools')}
          />
          </ScreenReveal>
        </>
      ) : (
        <>
          <ScreenReveal delayMs={40}>
            <SectionHeader
              subtitle={t('Sign in only when you want sync or premium, not for basic scanning.')}
              title={t('Upgrade this device later')}
            />
          </ScreenReveal>
          <ScreenReveal delayMs={70}>
            <ActionCard
            badge={t('Save and sync')}
            icon="log-in-outline"
            onPress={() => navigation.navigate('AccountIntro', { initialMode: 'login' })}
            subtitle={t(
              'Log in to keep scan history, household settings, and premium across devices.'
            )}
            title={t('Log in')}
          />
          </ScreenReveal>
          <ScreenReveal delayMs={100}>
            <ActionCard
            badge={t('Create account')}
            icon="person-add-outline"
            onPress={() => navigation.navigate('AccountIntro', { initialMode: 'signup' })}
            subtitle={t('Create an account only when you want sync across devices.')}
            title={t('Create account')}
          />
          </ScreenReveal>
          <ScreenReveal delayMs={130}>
            <SectionHeader
              subtitle={t('These controls should stay useful even before login.')}
              title={t('Preferences and support')}
            />
          </ScreenReveal>
          <ScreenReveal delayMs={160}>
            <ActionCard
            badge={t('Appearance')}
            icon="color-palette-outline"
            onPress={() => navigation.navigate('AppearanceSettings')}
            subtitle={t('Change theme and language without signing in.')}
            title={t('Appearance')}
          />
          </ScreenReveal>
          <ScreenReveal delayMs={190}>
            <ActionCard
            badge={t('Support')}
            icon="help-buoy-outline"
            onPress={() => navigation.navigate('SupportSettings')}
            subtitle={t('Open help, privacy, feedback, and support tools.')}
            title={t('Support')}
          />
          </ScreenReveal>
        </>
      )}
    </FeaturePageLayout>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    identityMetaLabel: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 12,
    },
    identityMetaPill: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 2,
      minWidth: 98,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    identityMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    identityMetaValue: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 15,
      fontWeight: '800',
    },
  });
