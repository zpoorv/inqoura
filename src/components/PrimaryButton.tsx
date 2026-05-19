import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useI18n } from './AppLanguageProvider';
import { useAppTheme } from './AppThemeProvider';

type PrimaryButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

export default function PrimaryButton({
  disabled = false,
  label,
  onPress,
}: PrimaryButtonProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={{ color: colors.primaryMuted }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text numberOfLines={2} style={styles.label}>
        {t(label)}
      </Text>
    </Pressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      borderRadius: 999,
      minHeight: 54,
      justifyContent: 'center',
      paddingHorizontal: 24,
      width: '100%',
    },
    buttonDisabled: {
      backgroundColor: colors.textMuted,
    },
    buttonPressed: {
      opacity: 0.9,
    },
    label: {
      color: colors.surface,
      fontFamily: typography.accentFontFamily,
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 20,
      textAlign: 'center',
    },
  });
