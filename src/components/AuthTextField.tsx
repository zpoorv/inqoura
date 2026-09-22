import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useI18n } from './AppLanguageProvider';
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
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const shouldShowPasswordToggle = secureTextEntry;
  const resolvedSecureTextEntry = shouldShowPasswordToggle ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{t(label)}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          editable={editable}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={t(placeholder)}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={resolvedSecureTextEntry}
          style={[
            styles.input,
            shouldShowPasswordToggle && styles.inputWithTrailingIcon,
            errorMessage && styles.inputError,
          ]}
          value={value}
        />
        {shouldShowPasswordToggle ? (
          <Pressable
            accessibilityHint={t('Double tap to reveal or hide your password.')}
            accessibilityLabel={t(isPasswordVisible ? 'Hide password' : 'Show password')}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setIsPasswordVisible((currentValue) => !currentValue)}
            style={styles.trailingIconButton}
          >
            <Ionicons
              color={colors.textMuted}
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
      {errorMessage ? <Text style={styles.errorText}>{t(errorMessage)}</Text> : null}
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    errorText: {
      color: colors.danger,
      fontFamily: typography.bodyFontFamily,
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
      fontFamily: typography.bodyFontFamily,
      fontSize: 16,
      minHeight: 54,
      paddingHorizontal: 16,
      paddingVertical: 14,
      textAlignVertical: 'center',
    },
    inputError: {
      borderColor: colors.danger,
    },
    inputWithTrailingIcon: {
      paddingRight: 52,
    },
    inputWrap: {
      justifyContent: 'center',
    },
    label: {
      color: colors.text,
      fontFamily: typography.headingFontFamily,
      fontSize: 14,
      fontWeight: '700',
    },
    trailingIconButton: {
      alignItems: 'center',
      height: 54,
      justifyContent: 'center',
      position: 'absolute',
      right: 12,
      width: 32,
    },
  });
