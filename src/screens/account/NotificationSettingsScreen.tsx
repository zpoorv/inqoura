import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import FeaturePageLayout from '../../components/FeaturePageLayout';
import OptionPickerModal from '../../components/OptionPickerModal';
import SettingsRow from '../../components/SettingsRow';
import SettingsSection from '../../components/SettingsSection';
import { useI18n } from '../../components/AppLanguageProvider';
import { useAppTheme } from '../../components/AppThemeProvider';
import { createDefaultPremiumEntitlement } from '../../models/premium';
import type {
  HistoryNotificationPermissionState,
} from '../../models/historyNotification';
import type { HistoryNotificationCadence, UserProfile } from '../../models/userProfile';
import type { RootStackParamList } from '../../navigation/types';
import { AuthServiceError } from '../../services/authHelpers';
import {
  cancelCurrentUserHistoryNotifications,
  getHistoryNotificationPermissionState,
  getHistoryNotificationStatusLabel,
  openHistoryNotificationSettings,
  requestHistoryNotificationPermission,
  syncHistoryNotificationsForCurrentUser,
} from '../../services/historyNotificationService';
import {
  readSessionResourceCache,
  SESSION_CACHE_KEYS,
} from '../../services/sessionResourceCache';
import {
  loadSessionPremiumEntitlement,
  loadSessionUserProfile,
} from '../../services/sessionDataService';
import { saveCurrentUserPreferences } from '../../services/userProfileService';

type NotificationSettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'NotificationSettings'
>;

export default function NotificationSettingsScreen({
  navigation,
}: NotificationSettingsScreenProps) {
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const cachedUserProfile = readSessionResourceCache<UserProfile | null>(
    SESSION_CACHE_KEYS.userProfile
  );
  const cachedPremiumEntitlement = readSessionResourceCache<{ isPremium: boolean }>(
    SESSION_CACHE_KEYS.premiumEntitlement
  );
  const [historyInsightsEnabled, setHistoryInsightsEnabled] = useState(
    cachedUserProfile?.historyInsightsEnabled ?? true
  );
  const [historyNotificationCadence, setHistoryNotificationCadence] =
    useState<HistoryNotificationCadence>(
      cachedUserProfile?.historyNotificationCadence ?? 'weekly'
    );
  const [historyNotificationPermissionState, setHistoryNotificationPermissionState] =
    useState<HistoryNotificationPermissionState>('undetermined');
  const [historyNotificationsEnabled, setHistoryNotificationsEnabled] = useState(
    cachedUserProfile?.historyNotificationsEnabled ?? false
  );
  const [isCadenceModalVisible, setIsCadenceModalVisible] = useState(false);
  const [draftCadence, setDraftCadence] = useState<HistoryNotificationCadence>(
    cachedUserProfile?.historyNotificationCadence ?? 'weekly'
  );
  const [isPremium, setIsPremium] = useState(
    (cachedPremiumEntitlement ?? createDefaultPremiumEntitlement()).isPremium
  );

  const cadenceOptions = [
    {
      description: t('Show the strongest scan nudge when something needs attention.'),
      id: 'smart' as const,
      label: t('Smart'),
    },
    {
      description: t('Bundle your recent scan patterns into a simple weekly recap.'),
      id: 'weekly' as const,
      label: t('Weekly'),
    },
  ];

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      void Promise.all([
        loadSessionUserProfile('stale-while-revalidate'),
        loadSessionPremiumEntitlement('stale-while-revalidate'),
        getHistoryNotificationPermissionState(),
      ])
        .then(([profile, entitlement, permissionState]) => {
          if (!isMounted) {
            return;
          }

          setHistoryInsightsEnabled(profile?.historyInsightsEnabled ?? true);
          setHistoryNotificationCadence(profile?.historyNotificationCadence ?? 'weekly');
          setDraftCadence(profile?.historyNotificationCadence ?? 'weekly');
          setHistoryNotificationsEnabled(profile?.historyNotificationsEnabled ?? false);
          setHistoryNotificationPermissionState(permissionState);
          setIsPremium((entitlement ?? createDefaultPremiumEntitlement()).isPremium);
        });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleToggleInsights = () => {
    if (!isPremium) {
      navigation.navigate('Premium', { featureId: 'history-personalization' });
      return;
    }

    const nextValue = !historyInsightsEnabled;
    setHistoryInsightsEnabled(nextValue);
    void (async () => {
      try {
        await saveCurrentUserPreferences({ historyInsightsEnabled: nextValue });
      } catch (error) {
        setHistoryInsightsEnabled(!nextValue);
        Alert.alert(
          t('History insights update failed'),
          error instanceof AuthServiceError
            ? t(error.message)
            : t('We could not save that history insight setting right now.')
        );
      }
    })();
  };

  const handleToggleNotifications = async () => {
    const nextValue = !historyNotificationsEnabled;

    if (!nextValue) {
      setHistoryNotificationsEnabled(false);
      void (async () => {
        await saveCurrentUserPreferences({ historyNotificationsEnabled: false }).catch(() => null);
        await cancelCurrentUserHistoryNotifications();
      })();
      return;
    }

    const permissionState = await requestHistoryNotificationPermission();
    setHistoryNotificationPermissionState(permissionState);

    if (permissionState !== 'granted') {
      setHistoryNotificationsEnabled(false);
      void saveCurrentUserPreferences({ historyNotificationsEnabled: false }).catch(() => null);
      void cancelCurrentUserHistoryNotifications();
      Alert.alert(
        t('Allow notifications'),
        t('Turn on notifications in system settings to receive weekly recaps and shopping nudges.'),
        [
          { style: 'cancel', text: t('Not now') },
          { text: t('Open settings'), onPress: () => void openHistoryNotificationSettings() },
        ]
      );
      return;
    }

    setHistoryNotificationsEnabled(true);
    void (async () => {
      try {
        await saveCurrentUserPreferences({ historyNotificationsEnabled: true });
        await syncHistoryNotificationsForCurrentUser();
      } catch (error) {
        setHistoryNotificationsEnabled(false);
        Alert.alert(
          t('Notification update failed'),
          error instanceof AuthServiceError
            ? t(error.message)
            : t('We could not turn on history notifications right now.')
        );
      }
    })();
  };

  const handleApplyCadence = () => {
    setHistoryNotificationCadence(draftCadence);
    setIsCadenceModalVisible(false);
    void (async () => {
      try {
        await saveCurrentUserPreferences({ historyNotificationCadence: draftCadence });
        await syncHistoryNotificationsForCurrentUser();
      } catch (error) {
        setHistoryNotificationCadence((current) => current);
        Alert.alert(
          t('Notification pace update failed'),
          error instanceof AuthServiceError
            ? t(error.message)
            : t('We could not save that notification pace right now.')
        );
      }
    })();
  };

  return (
    <FeaturePageLayout
      eyebrow={t('Notifications')}
      subtitle={t('History reminders and notification permissions live here.')}
      title={t('Notification settings')}
    >
      <SettingsSection title={t('History signals')}>
        <SettingsRow
          onPress={handleToggleInsights}
          subtitle={t('Weekly scan summaries and repeat-buy patterns.')}
          title={t('History Insights')}
          value={t(isPremium ? (historyInsightsEnabled ? 'On' : 'Off') : 'Premium')}
        />
        <SettingsRow
          onPress={() => void handleToggleNotifications()}
          subtitle={t('Local reminders based on your recent scans.')}
          title={t('History Notifications')}
          value={
            historyNotificationPermissionState === 'denied'
              ? t('Blocked')
              : historyNotificationsEnabled
                ? t('On')
                : t('Off')
          }
        />
        <SettingsRow
          disabled={!historyNotificationsEnabled || historyNotificationPermissionState !== 'granted'}
          onPress={() => setIsCadenceModalVisible(true)}
          subtitle={t('Choose whether nudges arrive smart-first or as a weekly recap.')}
          title={t('Notification Pace')}
          value={t(historyNotificationCadence === 'smart' ? 'Smart' : 'Weekly')}
        />
        <SettingsRow
          onPress={
            historyNotificationPermissionState === 'denied'
              ? () => {
                  void openHistoryNotificationSettings();
                }
              : undefined
          }
          subtitle={
            historyNotificationPermissionState === 'denied'
              ? t('Open system settings to allow weekly recaps and smart nudges.')
              : t('Preview of what this device can send.')
          }
          title={t('Notification Status')}
          value={getHistoryNotificationStatusLabel(
            historyNotificationsEnabled,
            historyNotificationPermissionState,
            historyNotificationCadence
          )}
        />
      </SettingsSection>

      <OptionPickerModal
        colors={colors}
        onApply={handleApplyCadence}
        onRequestClose={() => setIsCadenceModalVisible(false)}
        onSelect={setDraftCadence}
        options={cadenceOptions}
        selectedId={draftCadence}
        title={t('Choose notification pace')}
        visible={isCadenceModalVisible}
      />
    </FeaturePageLayout>
  );
}
