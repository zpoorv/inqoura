import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gyroscope } from 'expo-sensors';
import { triggerSafeHaptic } from '../../utils/haptics';

export interface FoodPurityMedallionProps {
  score: number;
  gradeLabel?: string | null;
  novaGroup?: number | null;
  nutriScoreGrade?: string | null;
  additivesCount?: number;
  size?: number;
}

export default function FoodPurityMedallion({
  score,
  gradeLabel,
  novaGroup = 1,
  nutriScoreGrade,
  additivesCount = 0,
  size = 140,
}: FoodPurityMedallionProps) {
  const [activeLayer, setActiveLayer] = useState<1 | 2 | 3>(1);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const layerTransition = useSharedValue(1);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    async function setupGyro() {
      try {
        const available = await Gyroscope.isAvailableAsync();
        if (!available || !isMounted || Platform.OS === 'web') return;

        Gyroscope.setUpdateInterval(50);
        subscription = Gyroscope.addListener(({ x, y }) => {
          tiltX.value = withTiming(Math.max(Math.min(y * 12, 25), -25), { duration: 50 });
          tiltY.value = withTiming(Math.max(Math.min(-x * 12, 25), -25), { duration: 50 });
        });
      } catch {
        // Fallback gracefully on devices without gyroscope
      }
    }

    void setupGyro();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [tiltX, tiltY]);

  const handlePressLayer = () => {
    triggerSafeHaptic();
    const nextLayer = (activeLayer === 3 ? 1 : activeLayer + 1) as 1 | 2 | 3;
    setActiveLayer(nextLayer);
    layerTransition.value = 0.8;
    layerTransition.value = withSpring(1, { damping: 12 });
  };

  const medallion3DStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 400 },
        { rotateX: `${tiltX.value}deg` },
        { rotateY: `${tiltY.value}deg` },
        { scale: layerTransition.value },
      ],
    };
  });

  const specularStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tiltY.value * 2.5 },
        { translateY: tiltX.value * 2.5 },
      ],
    };
  });

  const getThemeColor = () => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const themeColor = getThemeColor();

  return (
    <View style={styles.outerContainer}>
      <Pressable onPress={handlePressLayer} style={styles.pressableTarget}>
        <Animated.View
          style={[
            styles.medallion,
            { width: size, height: size, borderRadius: size / 2, borderColor: themeColor },
            medallion3DStyle,
          ]}
        >
          {/* Specular Highlight reflection */}
          <Animated.View
            style={[
              styles.specularShine,
              { width: size * 0.7, height: size * 0.7, borderRadius: (size * 0.7) / 2 },
              specularStyle,
            ]}
          />

          {/* Layer 1: Core Health Score */}
          {activeLayer === 1 && (
            <View style={styles.layerContent}>
              <Text style={[styles.scoreNumber, { color: themeColor }]}>{score}</Text>
              <Text style={styles.scoreSubtext}>Grade {gradeLabel}</Text>
              <Text style={styles.layerIndicator}>Tap for Depth</Text>
            </View>
          )}

          {/* Layer 2: Nutri-Score & NOVA degree */}
          {activeLayer === 2 && (
            <View style={styles.layerContent}>
              <Text style={styles.layerTitle}>Processing</Text>
              <Text style={[styles.novaText, { color: themeColor }]}>
                NOVA {novaGroup ?? 'N/A'}
              </Text>
              <Text style={styles.nutriScoreText}>
                Nutri: {nutriScoreGrade?.toUpperCase() ?? 'N/A'}
              </Text>
            </View>
          )}

          {/* Layer 3: Chemical & Additive load */}
          {activeLayer === 3 && (
            <View style={styles.layerContent}>
              <Text style={styles.layerTitle}>Additives</Text>
              <Text style={[styles.additivesCount, { color: themeColor }]}>
                {additivesCount}
              </Text>
              <Text style={styles.scoreSubtext}>
                {additivesCount === 0 ? 'Pure Food' : 'Identified'}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  pressableTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallion: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  specularShine: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  layerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 2,
  },
  layerIndicator: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  layerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  novaText: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 2,
  },
  nutriScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  additivesCount: {
    fontSize: 32,
    fontWeight: '900',
  },
});
