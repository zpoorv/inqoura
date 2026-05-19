import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, InteractionManager, Linking, StyleSheet, View } from 'react-native';

import BottomMenuBar from '../components/BottomMenuBar';
import NotificationBellButton from '../components/NotificationBellButton';
import { useI18n } from '../components/AppLanguageProvider';
import { useAppTheme } from '../components/AppThemeProvider';
import ScreenLoadingView from '../components/ScreenLoadingView';
import { APP_NAME } from '../constants/branding';
import {
  flushPendingHistoryNavigation,
  openMainRoute,
  rootNavigationRef,
  type MainNavigationRoute,
} from './navigationRef';
import AccountScreen from '../screens/account/AccountScreen';
import AccountIntroScreen from '../screens/account/AccountIntroScreen';
import HomeScreen from '../screens/core/HomeScreen';
import HistoryScreen from '../screens/core/HistoryScreen';
import PremiumScreen from '../screens/account/PremiumScreen';
import ResultScreen from '../screens/core/ResultScreen';
import ResetPasswordScreen from '../screens/account/ResetPasswordScreen';
import ScannerScreen from '../screens/core/ScannerScreen';
import { hydrateAuthSession } from '../services/authService';
import { AuthServiceError } from '../services/authHelpers';
import {
  getCachedAppBootstrapSnapshot,
  loadAppBootstrapSnapshot,
} from '../services/appBootstrapSnapshotService';
import {
  canHandleEmailLink,
  completeEmailLinkSignIn,
} from '../services/emailLinkAuthService';
import { loadEffectiveShoppingProfile } from '../services/householdProfilesService';
import {
  markPerformanceTrace,
  measurePerformanceTrace,
} from '../services/performanceTrace';
import { refreshCurrentPremiumEntitlement } from '../services/premiumEntitlementService';
import { clearSessionResourceCache } from '../services/sessionResourceCache';
import {
  clearPremiumSession,
  getAuthSession,
  setAuthSession,
  subscribeAuthSession,
} from '../store';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const loadAccountSettingsScreen = () => import('../screens/account/AccountSettingsScreen');
const loadNotificationSettingsScreen = () =>
  import('../screens/account/NotificationSettingsScreen');
const loadAppearanceSettingsScreen = () =>
  import('../screens/account/AppearanceSettingsScreen');
const loadHouseholdSettingsScreen = () =>
  import('../screens/account/HouseholdSettingsScreen');
const loadSupportSettingsScreen = () => import('../screens/account/SupportSettingsScreen');
const loadHelpScreen = () => import('../screens/support/HelpScreen');
const loadNotificationCenterScreen = () =>
  import('../screens/support/NotificationCenterScreen');
const loadPrivacyPolicyScreen = () => import('../screens/support/PrivacyPolicyScreen');
const loadAboutScreen = () => import('../screens/support/AboutScreen');
const loadFeedbackScreen = () => import('../screens/support/FeedbackScreen');

const AccountSettingsScreen = lazy(loadAccountSettingsScreen);
const NotificationSettingsScreen = lazy(loadNotificationSettingsScreen);
const AppearanceSettingsScreen = lazy(loadAppearanceSettingsScreen);
const HouseholdSettingsScreen = lazy(loadHouseholdSettingsScreen);
const SupportSettingsScreen = lazy(loadSupportSettingsScreen);
const HelpScreen = lazy(loadHelpScreen);
const NotificationCenterScreen = lazy(loadNotificationCenterScreen);
const PrivacyPolicyScreen = lazy(loadPrivacyPolicyScreen);
const AboutScreen = lazy(loadAboutScreen);
const FeedbackScreen = lazy(loadFeedbackScreen);

const PRIMARY_ROUTES = new Set<keyof RootStackParamList>([
  'Account',
  'Home',
  'History',
  'Premium',
  'Scanner',
]);

const NOTIFICATION_BELL_HIDDEN_ROUTES = new Set<keyof RootStackParamList>([
  'AccountIntro',
  'NotificationCenter',
  'ResetPassword',
]);

export default function RootNavigator() {
  const initialBootstrapSnapshot = getCachedAppBootstrapSnapshot();
  const [authSession, setAuthSessionState] = useState(
    initialBootstrapSnapshot?.authSession ?? getAuthSession()
  );
  const [currentRouteName, setCurrentRouteName] =
    useState<keyof RootStackParamList | null>(null);
  const [isHandlingEmailLink, setIsHandlingEmailLink] = useState(false);
  const [hasNavigationReady, setHasNavigationReady] = useState(false);
  const [hasQueuedAuthHydration, setHasQueuedAuthHydration] = useState(false);
  const [hasMeasuredAuthHydration, setHasMeasuredAuthHydration] = useState(false);
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const currentUserId = authSession.user?.id ?? null;
  const isAuthenticated = authSession.status === 'authenticated';
  const hasStoredUserSnapshot = Boolean(initialBootstrapSnapshot?.authSession.user ?? authSession.user);
  const isHydratingFirebaseAuth = authSession.status === 'loading';
  const resolvedAuthState =
    authSession.status === 'authenticated'
      ? 'authenticated'
      : authSession.status === 'guest'
        ? 'guest'
        : hasStoredUserSnapshot
          ? 'cached-authenticated'
          : 'guest-pending';
  const styles = useMemo(() => createStyles(colors), [colors]);

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      border: colors.border,
      card: colors.surface,
      notification: colors.primary,
      primary: colors.primary,
      text: colors.text,
    },
  };

  const syncCurrentRoute = useCallback(() => {
    setCurrentRouteName(rootNavigationRef.getCurrentRoute()?.name ?? null);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeAuthSession((nextSession) => {
      setAuthSessionState(nextSession);
    });

    if (initialBootstrapSnapshot && getAuthSession().status === 'loading') {
      setAuthSession(initialBootstrapSnapshot.authSession);
    }

    if (getAuthSession().status === 'loading') {
      void loadAppBootstrapSnapshot()
        .then((snapshot) => {
          if (!isMounted || getAuthSession().status !== 'loading') {
            return;
          }

          setAuthSession(snapshot.authSession);
        })
        .catch(() => {
          if (isMounted && getAuthSession().status === 'loading') {
            setAuthSession({ status: 'guest', user: null });
          }
        });
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [initialBootstrapSnapshot]);

  useEffect(() => {
    if (!hasNavigationReady || hasQueuedAuthHydration) {
      return;
    }

    setHasQueuedAuthHydration(true);
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      void hydrateAuthSession().catch(() => null);
    });

    return () => {
      interactionHandle.cancel();
    };
  }, [hasNavigationReady, hasQueuedAuthHydration]);

  useEffect(() => {
    if (hasMeasuredAuthHydration || isHydratingFirebaseAuth) {
      return;
    }

    measurePerformanceTrace('app-start', 'auth-hydration-finish', {
      resolvedAuthState,
    });
    setHasMeasuredAuthHydration(true);
  }, [hasMeasuredAuthHydration, isHydratingFirebaseAuth, resolvedAuthState]);

  useEffect(() => {
    clearSessionResourceCache();

    if (authSession.status === 'authenticated' && currentUserId && hasNavigationReady) {
      const interactionHandle = InteractionManager.runAfterInteractions(() => {
        void refreshCurrentPremiumEntitlement();
      });

      return () => {
        interactionHandle.cancel();
      };
    }

    if (authSession.status !== 'loading') {
      clearPremiumSession();
    }
  }, [authSession.status, currentUserId, hasNavigationReady]);

  useEffect(() => {
    flushPendingHistoryNavigation();
  }, [isAuthenticated]);

  useEffect(() => {
    let isMounted = true;

    const handleIncomingUrl = async (url: string | null) => {
      if (!url || !canHandleEmailLink(url)) {
        return;
      }

      if (isMounted) {
        setIsHandlingEmailLink(true);
      }

      try {
        await completeEmailLinkSignIn(url);
      } catch (error) {
        Alert.alert(
          'Email sign-in failed',
          error instanceof AuthServiceError
            ? error.message
            : 'We could not finish that email sign-in link.'
        );
      } finally {
        if (isMounted) {
          setIsHandlingEmailLink(false);
        }
      }
    };

    void Linking.getInitialURL().then((url) => {
      void handleIncomingUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingUrl(url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const handleBottomRoutePress = useCallback(
    async (route: MainNavigationRoute) => {
      if (route === 'Scanner') {
        if (!rootNavigationRef.isReady() || currentRouteName === 'Scanner') {
          return;
        }

        const effectiveProfile = await loadEffectiveShoppingProfile();
        rootNavigationRef.navigate('Scanner', {
          profileId: effectiveProfile.dietProfileId,
        });
        return;
      }

      openMainRoute(route);
    },
    [currentRouteName]
  );

  const activeBottomRoute =
    currentRouteName === 'Account' ||
    currentRouteName === 'Home' ||
    currentRouteName === 'History' ||
    currentRouteName === 'Premium' ||
    currentRouteName === 'Scanner'
      ? currentRouteName
      : undefined;
  const shouldShowBottomBar =
    currentRouteName !== null &&
    PRIMARY_ROUTES.has(currentRouteName);
  const shouldShowBootstrapScreen = isHandlingEmailLink;
  const navigatorKey = shouldShowBootstrapScreen ? 'email-link-bootstrap' : 'app';
  const initialRouteName: keyof RootStackParamList = 'Home';

  return (
    <Suspense fallback={<AuthBootstrapScreen />}>
      <NavigationContainer
        onReady={() => {
          setHasNavigationReady(true);
          syncCurrentRoute();
          flushPendingHistoryNavigation();
          measurePerformanceTrace('app-start', 'first-route-shell-paint', {
            initialRouteName,
            resolvedAuthState,
          });
          measurePerformanceTrace('app-start', 'route-ready');
        }}
        onStateChange={() => {
          syncCurrentRoute();
          const nextRouteName = rootNavigationRef.getCurrentRoute()?.name;

          if (nextRouteName === 'Scanner') {
            markPerformanceTrace('scanner-open');
          }
        }}
        ref={rootNavigationRef}
        theme={navigationTheme}
      >
        <View style={styles.root}>
          <Stack.Navigator
            initialRouteName={initialRouteName}
            key={navigatorKey}
            screenOptions={({ route }) => ({
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: colors.background },
              headerBackVisible: !PRIMARY_ROUTES.has(route.name),
              headerRight: NOTIFICATION_BELL_HIDDEN_ROUTES.has(route.name)
                ? undefined
                : () => (
                    <NotificationBellButton
                      onPress={() => {
                        if (!rootNavigationRef.isReady()) {
                          return;
                        }

                        rootNavigationRef.navigate('NotificationCenter');
                      }}
                    />
                  ),
              headerLeft: PRIMARY_ROUTES.has(route.name) ? () => null : undefined,
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: {
                color: colors.text,
                fontFamily: typography.headingFontFamily,
                fontWeight: '700',
              },
            })}
          >
            {shouldShowBootstrapScreen ? (
              <Stack.Screen
                name="AccountIntro"
                component={AuthBootstrapScreen}
                options={{ headerShown: false }}
              />
            ) : (
              <>
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ title: t('Home') }}
                />
                <Stack.Screen
                  name="Scanner"
                  component={ScannerScreen}
                  options={{ title: t('Scan Barcode') }}
                />
                <Stack.Screen
                  name="History"
                  component={HistoryScreen}
                  options={{ title: t('History') }}
                />
                <Stack.Screen
                  name="Account"
                  component={AccountScreen}
                  options={{ title: t('Account') }}
                />
                <Stack.Screen
                  name="Premium"
                  component={PremiumScreen}
                  options={{ title: t('Premium') }}
                />
                <Stack.Screen
                  name="AppearanceSettings"
                  component={AppearanceSettingsScreen}
                  options={{ title: t('Appearance') }}
                />
                <Stack.Screen
                  name="SupportSettings"
                  component={SupportSettingsScreen}
                  options={{ title: t('Support') }}
                />
                <Stack.Screen
                  name="Result"
                  component={ResultScreen}
                  options={{ title: t('Product Details') }}
                />
                <Stack.Screen
                  name="Help"
                  component={HelpScreen}
                  options={{ title: t('Help') }}
                />
                <Stack.Screen
                  name="NotificationCenter"
                  component={NotificationCenterScreen}
                  options={{ title: t('Notifications') }}
                />
                <Stack.Screen
                  name="PrivacyPolicy"
                  component={PrivacyPolicyScreen}
                  options={{ title: t('Privacy Policy') }}
                />
                <Stack.Screen
                  name="About"
                  component={AboutScreen}
                  options={{ title: t('About') }}
                />
                <Stack.Screen
                  name="Feedback"
                  component={FeedbackScreen}
                  options={{ title: t('Send Feedback') }}
                />
                {isAuthenticated ? (
                  <>
                    <Stack.Screen
                      name="AccountSettings"
                      component={AccountSettingsScreen}
                      options={{ title: t('Account') }}
                    />
                    <Stack.Screen
                      name="NotificationSettings"
                      component={NotificationSettingsScreen}
                      options={{ title: t('Notifications') }}
                    />
                    <Stack.Screen
                      name="HouseholdSettings"
                      component={HouseholdSettingsScreen}
                      options={{ title: t('Household') }}
                    />
                  </>
                ) : null}
                <Stack.Screen
                  name="AccountIntro"
                  component={AccountIntroScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ResetPassword"
                  component={ResetPasswordScreen}
                  options={{ title: t('Reset Password') }}
                />
              </>
            )}
          </Stack.Navigator>

          {shouldShowBottomBar ? (
            <View pointerEvents="box-none" style={styles.bottomBarOverlay}>
              <BottomMenuBar
                activeRoute={activeBottomRoute}
                onSelectRoute={(route) => {
                  void handleBottomRoutePress(route);
                }}
              />
            </View>
          ) : null}
        </View>
      </NavigationContainer>
    </Suspense>
  );
}

function AuthBootstrapScreen() {
  const { t } = useI18n();

  return (
    <ScreenLoadingView
      subtitle={t('Finishing your secure sign-in link...')}
      title={t('Opening {appName}', { appName: APP_NAME })}
    />
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    bottomBarOverlay: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
    },
    root: {
      backgroundColor: colors.background,
      flex: 1,
    },
  });
