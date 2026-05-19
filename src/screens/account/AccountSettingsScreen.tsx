import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  getLanguageDisplayLabel,
  useI18n,
} from '../../components/AppLanguageProvider';
import FeaturePageLayout from '../../components/FeaturePageLayout';
import OptionPickerModal from '../../components/OptionPickerModal';
import SettingsRow from '../../components/SettingsRow';
import SettingsSection from '../../components/SettingsSection';
import { useAppTheme } from '../../components/AppThemeProvider';
import { APP_NAME } from '../../constants/branding';
import { createDefaultPremiumEntitlement } from '../../models/premium';
import type { RootStackParamList } from '../../navigation/types';
import { deleteCurrentAccount } from '../../services/accountDeletionService';
import { AuthServiceError } from '../../services/authHelpers';
import { logoutAuth } from '../../services/authService';
import {
  readSessionResourceCache,
  SESSION_CACHE_KEYS,
} from '../../services/sessionResourceCache';
import {
  loadSessionPremiumEntitlement,
  loadSessionUserProfile,
} from '../../services/sessionDataService';

type AccountSettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'AccountSettings'
>;

export default function AccountSettingsScreen({
  navigation,
}: AccountSettingsScreenProps) {
  const { languageCode, languageOptions, setLanguageCode, t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const cachedProfile = readSessionResourceCache<{ email?: string; name?: string; role?: string }>(
    SESSION_CACHE_KEYS.userProfile
  );
  const cachedPremiumEntitlement = readSessionResourceCache<{ isPremium: boolean }>(
    SESSION_CACHE_KEYS.premiumEntitlement
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [draftLanguageCode, setDraftLanguageCode] = useState(languageCode);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [summary, setSummary] = useState({
    email: cachedProfile?.email ?? '',
    name: cachedProfile?.name?.trim() || cachedProfile?.email || APP_NAME,
    premiumLabel:
      (cachedPremiumEntitlement ?? createDefaultPremiumEntitlement()).isPremium
        ? 'Premium'
        : 'Basic',
    roleLabel:
      cachedProfile?.role === 'admin'
        ? 'Admin'
        : cachedProfile?.role === 'premium'
          ? 'Premium'
          : 'User',
  });

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      void Promise.all([
        loadSessionUserProfile('stale-while-revalidate'),
        loadSessionPremiumEntitlement('stale-while-revalidate'),
      ])
        .then(([profile, entitlement]) => {
          if (!isMounted) {
            return;
          }

          const nextEntitlement = entitlement ?? createDefaultPremiumEntitlement();
          setSummary({
            email: profile?.email ?? '',
            name: profile?.name?.trim() || profile?.email || APP_NAME,
            premiumLabel: nextEntitlement.isPremium ? 'Premium' : 'Basic',
            roleLabel:
              profile?.role === 'admin'
                ? 'Admin'
                : profile?.role === 'premium'
                  ? 'Premium'
                  : 'User',
          });
        })
        .catch(() => {
          if (!isMounted) {
            return;
          }

          setSummary({
            email: '',
            name: APP_NAME,
            premiumLabel: 'Basic',
            roleLabel: 'User',
          });
        });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      t('Delete account?'),
      t(
        'This removes your account, local history, and saved profile settings from this device.'
      ),
      [
        { style: 'cancel', text: t('Cancel') },
        {
          style: 'destructive',
          text: t('Delete'),
          onPress: () => {
            setIsDeleting(true);
            void deleteCurrentAccount()
              .catch((error) => {
                Alert.alert(
                  t('Delete account failed'),
                  error instanceof AuthServiceError
                    ? t(error.message)
                    : t('We could not delete your account right now.')
                );
              })
              .finally(() => setIsDeleting(false));
          },
        },
      ]
    );
  };

  return (
    <FeaturePageLayout
      eyebrow={t('Account')}
      subtitle={t('Manage sign out, deletion, history, and premium from here.')}
      title={t('Account settings')}
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{summary.name}</Text>
        <Text style={styles.summaryBody}>{summary.email || t('Signed in')}</Text>
        <Text style={styles.summaryMeta}>
          {`${t(summary.roleLabel)} • ${t(summary.premiumLabel)}`}
        </Text>
      </View>

      <SettingsSection title={t('Account tools')}>
        <SettingsRow
          onPress={() => navigation.navigate('Account')}
          subtitle={t('Return to the main account page.')}
          title={t('Account')}
          value={t('Open')}
        />
        <SettingsRow
          onPress={() => navigation.navigate('Premium')}
          subtitle={t('Manage your plan and premium benefits.')}
          title={t('Premium')}
          value={summary.premiumLabel}
        />
        <SettingsRow
          onPress={() => {
            setDraftLanguageCode(languageCode);
            setIsLanguageModalVisible(true);
          }}
          subtitle={t('Select language')}
          title={t('App language')}
          value={getLanguageDisplayLabel(languageCode)}
        />
        <SettingsRow
          onPress={() => navigation.navigate('History')}
          subtitle={t('Open your saved scan timeline.')}
          title={t('History')}
          value={t('Open')}
        />
        <SettingsRow onPress={() => void logoutAuth()} title={t('Log Out')} />
        <SettingsRow
          danger
          disabled={isDeleting}
          onPress={handleDeleteAccount}
          title={t('Delete Account')}
          value={isDeleting ? t('Working...') : undefined}
        />
      </SettingsSection>

      <OptionPickerModal
        colors={colors}
        onApply={() => {
          setIsLanguageModalVisible(false);
          void setLanguageCode(draftLanguageCode).catch((error) => {
            Alert.alert(
              t('Language update failed'),
              error instanceof AuthServiceError
                ? t(error.message)
                : t('We could not save that app language right now.')
            );
          });
        }}
        onRequestClose={() => {
          setDraftLanguageCode(languageCode);
          setIsLanguageModalVisible(false);
        }}
        onSelect={setDraftLanguageCode}
        options={languageOptions.map((language) => ({
          description: t(`Use ${language.englishLabel} throughout the app.`),
          id: language.code,
          label: language.nativeLabel,
        }))}
        selectedId={draftLanguageCode}
        title={t('Select language')}
        visible={isLanguageModalVisible}
      />
    </FeaturePageLayout>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    summaryBody: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 6,
      padding: 20,
    },
    summaryMeta: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    summaryTitle: {
      color: colors.text,
      fontFamily: typography.displayFontFamily,
      fontSize: 24,
      fontWeight: '800',
    },
  });
