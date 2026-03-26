import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from './AppThemeProvider';

type AuthTextFieldProps = {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?:
    | 'email'
    | 'password'
    | 'new-password'
    | 'off'
    | 'username';
  editable?: boolean;
  errorMessage?: string | null;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
};

export default function AuthTextField({
  autoCapitalize = 'none',
  autoComplete = 'off',
  editable = true,
  errorMessage,
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  value,
}: AuthTextFieldProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        style={[styles.input, errorMessage && styles.inputError]}
        value={value}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors']
) =>
  StyleSheet.create({
    errorText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
    },
    field: {
      gap: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      minHeight: 54,
      paddingHorizontal: 16,
    },
    inputError: {
      borderColor: colors.danger,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
  });
