import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from './AppThemeProvider';

type SettingsRowProps = {
  danger?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  subtitle?: string;
  title: string;
  value?: string;
};

export default function SettingsRow({
  danger = false,
  disabled = false,
  onPress,
  subtitle,
  title,
  value,
}: SettingsRowProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors, danger);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
    </Pressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  danger: boolean
) =>
  StyleSheet.create({
    copy: {
      flex: 1,
      gap: 4,
    },
    disabled: {
      opacity: 0.55,
    },
    pressed: {
      opacity: 0.88,
    },
    row: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    title: {
      color: danger ? colors.danger : colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    value: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'right',
    },
  });
