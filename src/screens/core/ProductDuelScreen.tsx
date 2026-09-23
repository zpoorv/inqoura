import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import type { ResolvedProduct } from '../../types/product';
import OptimizedImage from '../../components/common/OptimizedImage';

type Props = NativeStackScreenProps<RootStackParamList, any>;

export default function ProductDuelScreen({ navigation, route }: Props) {
  const productA: ResolvedProduct = route.params?.productA;
  const productB: ResolvedProduct = route.params?.productB;

  if (!productA || !productB) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Please select two products to initiate a duel.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Calculate winner score based on NOVA, Sugar, and Nutri-Score
  const scoreA = (productA.novaGroup === 1 ? 90 : productA.novaGroup === 4 ? 40 : 70) - (productA.nutrition.sugar100g || 0);
  const scoreB = (productB.novaGroup === 1 ? 90 : productB.novaGroup === 4 ? 40 : 70) - (productB.nutrition.sugar100g || 0);
  const winner = scoreA >= scoreB ? 'A' : 'B';

  const nutrients = [
    { label: 'Sugar (100g)', valA: productA.nutrition.sugar100g ?? 0, valB: productB.nutrition.sugar100g ?? 0, unit: 'g', lowerIsBetter: true },
    { label: 'Sat Fat (100g)', valA: productA.nutrition.saturatedFat100g ?? 0, valB: productB.nutrition.saturatedFat100g ?? 0, unit: 'g', lowerIsBetter: true },
    { label: 'Calories', valA: productA.nutrition.calories100g ?? 0, valB: productB.nutrition.calories100g ?? 0, unit: 'kcal', lowerIsBetter: true },
    { label: 'Protein (100g)', valA: productA.nutrition.protein100g ?? 0, valB: productB.nutrition.protein100g ?? 0, unit: 'g', lowerIsBetter: false },
    { label: 'Fiber (100g)', valA: productA.nutrition.fiber100g ?? 0, valB: productB.nutrition.fiber100g ?? 0, unit: 'g', lowerIsBetter: false },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Product Duel Arena ⚔️</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Matchup Card */}
        <View style={styles.duelCard}>
          <View style={styles.fighterCol}>
            <OptimizedImage uri={productA.imageUrl} style={styles.productThumb} />
            <Text numberOfLines={2} style={styles.productName}>{productA.name}</Text>
            {winner === 'A' && <View style={styles.winnerBadge}><Text style={styles.winnerText}>🏆 WINNER</Text></View>}
          </View>

          <Text style={styles.vsText}>VS</Text>

          <View style={styles.fighterCol}>
            <OptimizedImage uri={productB.imageUrl} style={styles.productThumb} />
            <Text numberOfLines={2} style={styles.productName}>{productB.name}</Text>
            {winner === 'B' && <View style={styles.winnerBadge}><Text style={styles.winnerText}>🏆 WINNER</Text></View>}
          </View>
        </View>

        {/* Nutritional Comparison Matrix */}
        <View style={styles.matrixCard}>
          <Text style={styles.matrixTitle}>Nutritional Battle Bars</Text>
          {nutrients.map((n) => {
            const isAWinner = n.lowerIsBetter ? n.valA <= n.valB : n.valA >= n.valB;
            return (
              <View key={n.label} style={styles.metricRow}>
                <Text style={styles.metricLabel}>{n.label}</Text>
                <View style={styles.barCompareRow}>
                  <Text style={[styles.metricVal, isAWinner && styles.metricWinner]}>
                    {n.valA}{n.unit}
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFillA, { flex: Math.max(n.valA, 1) }]} />
                    <View style={[styles.barFillB, { flex: Math.max(n.valB, 1) }]} />
                  </View>
                  <Text style={[styles.metricVal, !isAWinner && styles.metricWinner]}>
                    {n.valB}{n.unit}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Processing Tier Duel */}
        <View style={styles.processingCard}>
          <Text style={styles.matrixTitle}>Processing Degree</Text>
          <View style={styles.processingRow}>
            <Text style={styles.processingVal}>NOVA {productA.novaGroup ?? '?'}</Text>
            <Text style={styles.processingDivider}>⚡</Text>
            <Text style={styles.processingVal}>NOVA {productB.novaGroup ?? '?'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 16 },
  backButton: { backgroundColor: '#111827', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  backButtonText: { color: '#ffffff', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  scrollContent: { padding: 16 },
  duelCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  fighterCol: { flex: 1, alignItems: 'center' },
  productThumb: { width: 80, height: 80, borderRadius: 12, marginBottom: 8 },
  productName: { fontSize: 13, fontWeight: '700', textAlign: 'center', color: '#111827', height: 36 },
  vsText: { fontSize: 20, fontWeight: '900', color: '#9ca3af', paddingHorizontal: 8 },
  winnerBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  winnerText: { color: '#15803d', fontSize: 11, fontWeight: '800' },
  matrixCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  matrixTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  metricRow: { marginBottom: 12 },
  metricLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  barCompareRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricVal: { fontSize: 12, fontWeight: '700', color: '#4b5563', width: 55, textAlign: 'center' },
  metricWinner: { color: '#10b981', fontWeight: '900' },
  barTrack: { flex: 1, height: 8, flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  barFillA: { backgroundColor: '#3b82f6', height: '100%' },
  barFillB: { backgroundColor: '#f97316', height: '100%' },
  processingCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  processingRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 8 },
  processingVal: { fontSize: 16, fontWeight: '800', color: '#111827' },
  processingDivider: { fontSize: 18 },
});
