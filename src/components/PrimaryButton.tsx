import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: colors.primaryMuted }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors']
) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: colors.primary,
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
      fontSize: 16,
      fontWeight: '700',
    },
  });
