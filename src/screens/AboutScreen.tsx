import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { useAppTheme } from '../components/AppThemeProvider';
import { APP_ANDROID_PACKAGE, APP_NAME } from '../constants/branding';

export default function AboutScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>About</Text>
        <Text style={styles.title}>About {APP_NAME}</Text>
        <View style={styles.card}>
          <Text style={styles.body}>
            Inqoura helps people understand packaged food faster using barcode lookup,
            ingredient OCR, deterministic scoring, and explainers.
          </Text>
          <Text style={styles.meta}>Package: {APP_ANDROID_PACKAGE}</Text>
          <Text style={styles.meta}>Version: {Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text style={styles.meta}>
            Build: {String(Constants.expoConfig?.android?.versionCode ?? 1)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors']
) =>
  StyleSheet.create({
    body: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 12,
      padding: 20,
    },
    content: {
      gap: 20,
      padding: 24,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    meta: {
      color: colors.textMuted,
      fontSize: 14,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 34,
    },
  });
