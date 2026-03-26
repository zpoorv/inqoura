import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../components/AppThemeProvider';

const HELP_ITEMS = [
  'Barcode scans fetch product data from Open Food Facts when available.',
  'OCR works best with a clear, cropped ingredient label image.',
  'Diet profiles adjust scoring rules, but they do not replace medical advice.',
  'History is saved on-device and can also be synced to your account once Firestore is enabled.',
];

export default function HelpScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Help</Text>
        <Text style={styles.title}>How Inqoura works today</Text>
        <View style={styles.card}>
          {HELP_ITEMS.map((item) => (
            <View key={item} style={styles.item}>
              <View style={styles.dot} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors']
) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 14,
      padding: 20,
    },
    content: {
      gap: 20,
      padding: 24,
    },
    dot: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      height: 8,
      marginTop: 6,
      width: 8,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    item: {
      flexDirection: 'row',
      gap: 12,
    },
    itemText: {
      color: colors.text,
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
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
