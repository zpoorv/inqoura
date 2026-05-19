import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../../components/AppLanguageProvider';
import { useAppTheme } from '../../components/AppThemeProvider';
import AuthTextField from '../../components/AuthTextField';
import PrimaryButton from '../../components/PrimaryButton';
import { APP_NAME } from '../../constants/branding';
import { AuthServiceError } from '../../services/authHelpers';
import { requestPasswordReset } from '../../services/authService';
import type { RootStackParamList } from '../../navigation/types';

type ResetPasswordScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ResetPassword'
>;

export default function ResetPasswordScreen({
  navigation,
}: ResetPasswordScreenProps) {
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetRequest = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      const message = await requestPasswordReset(email);
      setInfoMessage(message);
    } catch (error) {
      setErrorMessage(
        error instanceof AuthServiceError
          ? t(error.message)
          : t('We could not check that email right now.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.replace('AccountIntro', { initialMode: 'login' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 24, 32) },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{t('Password Reset')}</Text>
            <Text style={styles.title}>
              {t('Reset your {appName} password', { appName: APP_NAME })}
            </Text>
          </View>

          <View style={styles.card}>
            <AuthTextField
              autoComplete="email"
              errorMessage={errorMessage}
              keyboardType="email-address"
              label={t('Email')}
              onChangeText={setEmail}
              placeholder={t('you@example.com')}
              value={email}
            />
            {infoMessage ? <Text style={styles.infoText}>{t(infoMessage)}</Text> : null}
            <PrimaryButton
              disabled={isSubmitting}
              label={isSubmitting ? t('Sending...') : t('Send Reset Email')}
              onPress={() => void handleResetRequest()}
            />
            <PrimaryButton label={t('Back to Login')} onPress={handleBackToLogin} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors']
) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  content: {
    flexGrow: 1,
    gap: 24,
    padding: 24,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  header: {
    gap: 10,
    paddingTop: 12,
  },
  infoText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  keyboardWrap: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
});
