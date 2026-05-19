import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from './AppThemeProvider';
import { useI18n } from './AppLanguageProvider';
import {
  getNotificationCenterState,
  subscribeNotificationCenter,
} from '../store/notificationCenterStore';

type NotificationBellButtonProps = {
  onPress: () => void;
};

export default function NotificationBellButton({
  onPress,
}: NotificationBellButtonProps) {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [unreadCount, setUnreadCount] = useState(
    getNotificationCenterState().unreadCount
  );

  useEffect(() => {
    return subscribeNotificationCenter((state) => {
      setUnreadCount(state.unreadCount);
    });
  }, []);

  return (
    <Pressable
      accessibilityLabel={t('Open notifications')}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Ionicons color={colors.text} name="notifications-outline" size={22} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    badge: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderColor: colors.surface,
      borderRadius: 999,
      borderWidth: 2,
      justifyContent: 'center',
      minHeight: 18,
      minWidth: 18,
      paddingHorizontal: 4,
      position: 'absolute',
      right: -4,
      top: -4,
    },
    badgeText: {
      color: colors.surface,
      fontFamily: typography.accentFontFamily,
      fontSize: 10,
      fontWeight: '800',
    },
    button: {
      marginRight: 6,
      padding: 8,
      position: 'relative',
    },
    buttonPressed: {
      opacity: 0.7,
    },
  });
