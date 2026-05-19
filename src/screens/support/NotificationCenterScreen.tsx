import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import FeaturePageLayout from '../../components/FeaturePageLayout';
import PageStateCard from '../../components/PageStateCard';
import { useI18n } from '../../components/AppLanguageProvider';
import { useAppTheme } from '../../components/AppThemeProvider';
import type { AppNotificationItem } from '../../models/appNotification';
import type { RootStackParamList } from '../../navigation/types';
import { markAllNotificationsRead } from '../../services/notificationCenterService';
import {
  getNotificationCenterState,
  subscribeNotificationCenter,
} from '../../store/notificationCenterStore';

type NotificationCenterScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'NotificationCenter'
>;

export default function NotificationCenterScreen({
  navigation,
}: NotificationCenterScreenProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [items, setItems] = useState<AppNotificationItem[]>(
    getNotificationCenterState().items
  );

  useEffect(() => {
    void markAllNotificationsRead();
    return subscribeNotificationCenter((state) => {
      setItems(state.items);
    });
  }, []);

  return (
    <FeaturePageLayout
      eyebrow={t('Notifications')}
      subtitle={t('New reminders from the notification bar appear here too.')}
      title={t('Notifications')}
    >
      {items.length === 0 ? (
        <PageStateCard
          icon="notifications-off-outline"
          subtitle={t(
            "When a new reminder arrives, it will show up here and in your phone's notification bar."
          )}
          title={t('No notifications yet')}
        />
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => navigation.navigate(item.targetScreen)}
            style={({ pressed }) => [
              styles.card,
              !item.unread && styles.cardRead,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t(item.title)}</Text>
              <Text style={styles.cardMeta}>
                {item.unread ? t('New') : t('Seen')}
              </Text>
            </View>
            <Text style={styles.cardBody}>{t(item.body)}</Text>
            <Text style={styles.cardFooter}>{t('Open history')}</Text>
          </Pressable>
        ))
      )}
    </FeaturePageLayout>
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
      borderRadius: 24,
      borderWidth: 1,
      gap: 10,
      padding: 18,
    },
    cardBody: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
      lineHeight: 21,
    },
    cardFooter: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    cardHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    cardMeta: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    cardPressed: {
      opacity: 0.85,
    },
    cardRead: {
      opacity: 0.78,
    },
    cardTitle: {
      color: colors.text,
      flex: 1,
      fontFamily: typography.headingFontFamily,
      fontSize: 17,
      fontWeight: '800',
    },
  });
