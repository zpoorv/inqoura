import { useEffect, useState } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../components/AppThemeProvider';
import { APP_NAME } from '../constants/branding';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import { hydrateAuthSession } from '../services/authService';
import {
  canHandleEmailLink,
  completeEmailLinkSignIn,
} from '../services/emailLinkAuthService';
import { AuthServiceError } from '../services/authHelpers';
import { getAuthSession, subscribeAuthSession } from '../store';
import ResultScreen from '../screens/ResultScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ScannerScreen from '../screens/ScannerScreen';
import SignUpScreen from '../screens/SignUpScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [authSession, setAuthSession] = useState(getAuthSession());
  const [isHandlingEmailLink, setIsHandlingEmailLink] = useState(false);
  const { colors } = useAppTheme();

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

  useEffect(() => {
    const unsubscribe = subscribeAuthSession(setAuthSession);
    void hydrateAuthSession();

    return unsubscribe;
  }, []);

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

  const isAuthenticated = authSession.status === 'authenticated';

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      >
        {authSession.status === 'loading' || isHandlingEmailLink ? (
          <Stack.Screen
            name="Login"
            component={AuthBootstrapScreen}
            options={{ headerShown: false }}
          />
        ) : isAuthenticated ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: APP_NAME }}
            />
            <Stack.Screen
              name="Settings"
              getComponent={() => require('../screens/SettingsScreen').default}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="ProfileDetails"
              getComponent={() => require('../screens/ProfileDetailsScreen').default}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen
              name="History"
              getComponent={() => require('../screens/HistoryScreen').default}
              options={{ title: 'Scan History' }}
            />
            <Stack.Screen
              name="Scanner"
              component={ScannerScreen}
              options={{ title: 'Scan Barcode' }}
            />
            <Stack.Screen
              name="IngredientOcr"
              getComponent={() => require('../screens/IngredientOcrScreen').default}
              options={{ title: 'Scan Ingredients' }}
            />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{ title: 'Product Details' }}
            />
            <Stack.Screen
              name="Help"
              getComponent={() => require('../screens/HelpScreen').default}
              options={{ title: 'Help' }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              getComponent={() => require('../screens/PrivacyPolicyScreen').default}
              options={{ title: 'Privacy Policy' }}
            />
            <Stack.Screen
              name="About"
              getComponent={() => require('../screens/AboutScreen').default}
              options={{ title: 'About' }}
            />
            <Stack.Screen
              name="Feedback"
              getComponent={() => require('../screens/FeedbackScreen').default}
              options={{ title: 'Send Feedback' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Log In' }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ title: 'Create Account' }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Reset Password' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AuthBootstrapScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.bootstrapScreen}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.bootstrapText}>Loading your account...</Text>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors']
) =>
  StyleSheet.create({
    bootstrapScreen: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      gap: 14,
      justifyContent: 'center',
    },
    bootstrapText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
    },
  });
