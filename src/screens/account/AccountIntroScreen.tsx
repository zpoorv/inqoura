import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLanguageDisplayLabel, useI18n } from '../../components/AppLanguageProvider';
import { useAppTheme } from '../../components/AppThemeProvider';
import AuthTextField from '../../components/AuthTextField';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import OptionPickerModal from '../../components/OptionPickerModal';
import PrimaryButton from '../../components/PrimaryButton';
import { APP_NAME } from '../../constants/branding';
import { AuthServiceError } from '../../services/authHelpers';
import {
  loginWithEmail,
  resendVerificationEmailForLogin,
  signUpWithEmail,
} from '../../services/authService';
import { sendPasswordlessEmailLink } from '../../services/emailLinkAuthService';
import type { RootStackParamList } from '../../navigation/types';
import { getAuthSession, subscribeAuthSession } from '../../store';

type AccountIntroScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'AccountIntro'
>;
type AuthMode = 'login' | 'signup';

export default function AccountIntroScreen({
  navigation,
  route,
}: AccountIntroScreenProps) {
  const { languageCode, languageOptions, setLanguageCode, t } = useI18n();
  const { colors, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [authSession, setAuthSession] = useState(getAuthSession());
  const [mode, setMode] = useState<AuthMode>(route.params?.initialMode ?? 'login');
  const [draftLanguageCode, setDraftLanguageCode] = useState(languageCode);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(route.params?.prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(
    route.params?.notice ?? null
  );
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const appLanguageOptions = languageOptions.map((language) => ({
    description: t(`Use ${language.englishLabel} throughout the app.`),
    id: language.code,
    label: language.nativeLabel,
  }));

  useEffect(() => subscribeAuthSession(setAuthSession), []);

  useEffect(() => {
    if (route.params?.initialMode) {
      setMode(route.params.initialMode);
    }

    if (route.params?.prefillEmail) {
      setEmail(route.params.prefillEmail);
    }

    if (route.params?.notice) {
      setNoticeMessage(route.params.notice);
      setCanResendVerification(false);
    }
  }, [route.params?.initialMode, route.params?.notice, route.params?.prefillEmail]);

  useEffect(() => {
    if (authSession.status !== 'authenticated') {
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [authSession.status, navigation]);

  const openHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
    setNoticeMessage(null);
    setCanResendVerification(false);
    setPassword('');
    setPasswordConfirmation('');
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setNoticeMessage(null);
    setCanResendVerification(false);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        await signUpWithEmail({
          email,
          name,
          password,
          passwordConfirmation,
        });

        openHome();
        return;
      }

      await loginWithEmail({ email, password });
      openHome();
    } catch (error) {
      if (
        error instanceof AuthServiceError &&
        error.code === 'verification-required'
      ) {
        setNoticeMessage(error.message);
        setCanResendVerification(true);
        return;
      }

      setErrorMessage(
        error instanceof AuthServiceError
          ? t(error.message)
          : mode === 'signup'
            ? t('We could not create your account right now.')
            : t('We could not log you in right now.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLink = async () => {
    setErrorMessage(null);
    setNoticeMessage(null);
    setCanResendVerification(false);
    setIsSendingLink(true);

    try {
      const message = await sendPasswordlessEmailLink(email);
      setNoticeMessage(message);
    } catch (error) {
      setErrorMessage(
        error instanceof AuthServiceError
          ? t(error.message)
          : t('We could not send a sign-in link right now.')
      );
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMessage(null);
    setNoticeMessage(null);
    setIsResendingVerification(true);

    try {
      const nextNotice = await resendVerificationEmailForLogin({ email, password });
      setNoticeMessage(nextNotice);
      setCanResendVerification(
        nextNotice.startsWith('We sent another verification email')
      );
    } catch (error) {
      setErrorMessage(
        error instanceof AuthServiceError
          ? t(error.message)
          : t('We could not send another verification email right now.')
      );
    } finally {
      setIsResendingVerification(false);
    }
  };

  const isSignupMode = mode === 'signup';
  const isBusy = isSubmitting || isSendingLink || isResendingVerification;
  const title = isSignupMode
    ? t('Create your {appName} account', { appName: APP_NAME })
    : t('Log in to {appName}', { appName: APP_NAME });
  const subtitle = isSignupMode
    ? t(
        'Create an account only when you want sync, premium, and preferences across devices.'
      )
    : t(
        'You can keep scanning without an account. Log in only when you want to save and sync your history.'
      );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 24, 32) },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>
              {isSignupMode ? t('Create Account') : t('Welcome Back')}
            </Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.languageRow}>
            <View style={styles.languageCopy}>
              <Text style={styles.languageLabel}>{t('App language')}</Text>
              <Text style={styles.languageValue}>{getLanguageDisplayLabel(languageCode)}</Text>
              <Text style={styles.languageHint}>
                {t('You can change this any time later from Account.')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraftLanguageCode(languageCode);
                setIsLanguageModalVisible(true);
              }}
              style={styles.languageButton}
            >
              <Text style={styles.languageButtonText}>{t('Select language')}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.modeRow}>
              {(['login', 'signup'] as const).map((entryMode) => {
                const isSelected = entryMode === mode;

                return (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isBusy}
                    key={entryMode}
                    onPress={() => handleModeChange(entryMode)}
                    style={[styles.modeChip, isSelected && styles.modeChipSelected]}
                  >
                    <Text
                      style={[
                        styles.modeChipText,
                        isSelected && styles.modeChipTextSelected,
                      ]}
                    >
                      {t(entryMode === 'login' ? 'Log In' : 'Create Account')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>
              {t(isSignupMode ? 'Create with email' : 'Sign in with email')}
            </Text>

            {noticeMessage ? (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeText}>{t(noticeMessage)}</Text>
              </View>
            ) : null}

            {isSignupMode ? (
              <AuthTextField
                autoCapitalize="words"
                label={t('Name')}
                onChangeText={setName}
                placeholder={t('Your full name')}
                value={name}
              />
            ) : null}

            <AuthTextField
              autoComplete="email"
              keyboardType="email-address"
              label={t('Email')}
              onChangeText={setEmail}
              placeholder={t('you@example.com')}
              value={email}
            />
            <AuthTextField
              autoComplete={isSignupMode ? 'new-password' : 'password'}
              label={t('Password')}
              onChangeText={setPassword}
              placeholder={
                isSignupMode ? t('Use at least 8 characters') : t('Enter your password')
              }
              secureTextEntry
              value={password}
            />

            {isSignupMode ? (
              <AuthTextField
                autoComplete="new-password"
                label={t('Confirm Password')}
                onChangeText={setPasswordConfirmation}
                placeholder={t('Re-enter your password')}
                secureTextEntry
                value={passwordConfirmation}
              />
            ) : null}

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <PrimaryButton
              disabled={isBusy}
              label={
                isSubmitting
                  ? isSignupMode
                    ? t('Creating Account...')
                    : t('Logging In...')
                  : t(isSignupMode ? 'Create Account' : 'Log In')
              }
              onPress={() => void handleSubmit()}
            />

            {!isSignupMode && canResendVerification ? (
              <Pressable
                accessibilityRole="button"
                disabled={isBusy}
                onPress={() => void handleResendVerification()}
                style={styles.link}
              >
                <Text style={styles.linkText}>
                  {t(
                    isResendingVerification
                      ? 'Sending verification again...'
                      : 'Send verification again'
                  )}
                </Text>
              </Pressable>
            ) : null}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.secondaryBlock}>
              <Text style={styles.sectionLabel}>{t('Use Google instead')}</Text>
              <Text style={styles.sectionHint}>
                {t('Google sign-in is still instant and keeps the same account benefits.')}
              </Text>
            </View>
            <GoogleSignInButton
              label={t(isSignupMode ? 'Create with Google' : 'Continue with Google')}
              onSuccess={openHome}
            />

            {!isSignupMode ? (
              <View style={styles.tertiaryBlock}>
                <Text style={styles.sectionLabel}>{t('Need another way in?')}</Text>
                <View style={styles.linkStack}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('ResetPassword')}
                    style={styles.link}
                  >
                    <Text style={styles.linkText}>{t('Forgot password?')}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isBusy}
                    onPress={() => void handleEmailLink()}
                    style={styles.link}
                  >
                    <Text style={styles.linkText}>
                      {t(
                        isSendingLink
                          ? 'Sending sign-in link...'
                          : 'Email me a sign-in link'
                      )}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t(isSignupMode ? 'Already have an account?' : 'Do not have an account yet?')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => handleModeChange(isSignupMode ? 'login' : 'signup')}
            >
              <Text style={styles.footerLink}>
                {t(isSignupMode ? 'Log In' : 'Create Account')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }

                navigation.replace('Scanner');
              }}
            >
              <Text style={styles.footerLink}>{t('Continue without account')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OptionPickerModal
        colors={colors}
        onApply={() => {
          setIsLanguageModalVisible(false);
          void setLanguageCode(draftLanguageCode).catch(() => null);
        }}
        onRequestClose={() => setIsLanguageModalVisible(false)}
        onSelect={setDraftLanguageCode}
        options={appLanguageOptions}
        selectedId={draftLanguageCode}
        title={t('Select language')}
        visible={isLanguageModalVisible}
      />
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 26,
      borderWidth: 1,
      gap: 16,
      padding: 20,
    },
    content: {
      flexGrow: 1,
      gap: 18,
      padding: 24,
    },
    dividerLine: {
      backgroundColor: colors.border,
      flex: 1,
      height: 1,
    },
    dividerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
    },
    dividerText: {
      color: colors.textMuted,
      fontFamily: typography.accentFontFamily,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    errorText: {
      color: colors.danger,
      fontFamily: typography.bodyFontFamily,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 19,
    },
    eyebrow: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    footer: {
      alignItems: 'center',
      gap: 6,
      paddingBottom: 8,
    },
    footerLink: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 15,
      fontWeight: '800',
      textAlign: 'center',
    },
    footerText: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      textAlign: 'center',
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 30,
      borderWidth: 1,
      gap: 10,
      padding: 24,
    },
    keyboardWrap: {
      flex: 1,
    },
    languageButton: {
      alignItems: 'center',
      backgroundColor: colors.primaryMuted,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: 14,
    },
    languageButtonText: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
    },
    languageCopy: {
      flex: 1,
      gap: 4,
    },
    languageHint: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 13,
      lineHeight: 19,
    },
    languageLabel: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    languageRow: {
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 22,
      borderWidth: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      padding: 16,
    },
    languageValue: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 16,
      fontWeight: '700',
    },
    link: {
      alignSelf: 'flex-start',
    },
    linkStack: {
      gap: 8,
    },
    linkText: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 14,
      fontWeight: '700',
    },
    noticeCard: {
      backgroundColor: colors.primaryMuted,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    modeChip: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      minHeight: 42,
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    modeChipSelected: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    modeChipText: {
      color: colors.textMuted,
      fontFamily: typography.accentFontFamily,
      fontSize: 13,
      fontWeight: '800',
    },
    modeChipTextSelected: {
      color: colors.primary,
    },
    modeRow: {
      flexDirection: 'row',
      gap: 10,
    },
    noticeText: {
      color: colors.primary,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 21,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    secondaryBlock: {
      gap: 4,
    },
    sectionHint: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 13,
      lineHeight: 19,
    },
    sectionLabel: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    subtitle: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 15,
      lineHeight: 22,
    },
    tertiaryBlock: {
      gap: 8,
    },
    title: {
      color: colors.text,
      fontFamily: typography.displayFontFamily,
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 36,
    },
  });
