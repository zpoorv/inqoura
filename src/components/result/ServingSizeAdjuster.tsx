import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ResolvedNutrition } from '../../types/product';
import { triggerSelectionHaptic } from '../../utils/haptics';

export interface ServingSizeAdjusterProps {
  nutrition?: ResolvedNutrition;
  packageWeightGrams?: number | null;
}

export default function ServingSizeAdjuster({
  nutrition,
  packageWeightGrams = 250,
}: ServingSizeAdjusterProps) {
  const [activePortionGrams, setActivePortionGrams] = useState<number>(100);

  const packGrams = packageWeightGrams || 250;
  const portionSteps = [
    { label: '50g Snack', grams: 50 },
    { label: '100g Std', grams: 100 },
    { label: `Full Pack (${packGrams}g)`, grams: packGrams },
  ];

  const scaleFactor = activePortionGrams / 100;

  const baseCalories = nutrition?.calories100g ?? 0;
  const baseSugar = nutrition?.sugar100g ?? 0;
  const baseSodiumMg = (nutrition?.sodium100g ?? ((nutrition?.salt100g ?? 0) * 0.4)) * 1000;

  const scaledCalories = Math.round(baseCalories * scaleFactor);
  const scaledSugar = Number((baseSugar * scaleFactor).toFixed(1));
  const sugarTeaspoons = (scaledSugar / 4).toFixed(1);
  const sodiumDailyPct = Math.min(100, Math.round(((baseSodiumMg * scaleFactor) / 2300) * 100));

  const handleSelectPortion = (grams: number) => {
    triggerSelectionHaptic();
    setActivePortionGrams(grams);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dynamic Macro & Portion Adjuster</Text>
      <Text style={styles.subtitle}>Recalculate calories, sugar, and sodium per exact serving</Text>

      {/* Portion Step Selector */}
      <View style={styles.stepRow}>
        {portionSteps.map((step) => {
          const isSelected = activePortionGrams === step.grams;
          return (
            <Pressable
              key={step.label}
              onPress={() => handleSelectPortion(step.grams)}
              style={[styles.stepChip, isSelected && styles.stepChipActive]}
            >
              <Text style={[styles.stepText, isSelected && styles.stepTextActive]}>
                {step.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Scaled Macro Gauges */}
      <View style={styles.macroGrid}>
        <View style={styles.macroCard}>
          <Text style={styles.macroValue}>{scaledCalories}</Text>
          <Text style={styles.macroLabel}>Calories (kcal)</Text>
        </View>

        <View style={styles.macroCard}>
          <Text style={[styles.macroValue, scaledSugar > 15 ? { color: '#ef4444' } : null]}>
            {scaledSugar}g
          </Text>
          <Text style={styles.macroLabel}>Sugar ({sugarTeaspoons} tsp)</Text>
        </View>

        <View style={styles.macroCard}>
          <Text style={[styles.macroValue, sodiumDailyPct > 35 ? { color: '#f59e0b' } : null]}>
            {sodiumDailyPct}%
          </Text>
          <Text style={styles.macroLabel}>Daily Sodium</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  stepChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  stepChipActive: {
    backgroundColor: '#111827',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  stepTextActive: {
    color: '#ffffff',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
});
