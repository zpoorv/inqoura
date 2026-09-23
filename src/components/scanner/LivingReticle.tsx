import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

export type ReticleStatus = 'searching' | 'locked' | 'danger';

export interface LivingReticleProps {
  barcodeBox?: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  status?: ReticleStatus;
  defaultWidth?: number;
  defaultHeight?: number;
}

export default function LivingReticle({
  barcodeBox,
  status = 'searching',
  defaultWidth = 240,
  defaultHeight = 160,
}: LivingReticleProps) {
  const width = useSharedValue(defaultWidth);
  const height = useSharedValue(defaultHeight);
  const pulse = useSharedValue(1);
  const statusAnim = useSharedValue(0); // 0 = searching, 1 = locked, 2 = danger

  useEffect(() => {
    if (status === 'locked') {
      statusAnim.value = withTiming(1, { duration: 150 });
    } else if (status === 'danger') {
      statusAnim.value = withTiming(2, { duration: 150 });
    } else {
      statusAnim.value = withTiming(0, { duration: 200 });
    }
  }, [status, statusAnim]);

  useEffect(() => {
    if (status === 'searching') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 900 }),
          withTiming(0.98, { duration: 900 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withSpring(1);
    }
  }, [status, pulse]);

  useEffect(() => {
    if (barcodeBox && barcodeBox.size.width > 20 && barcodeBox.size.height > 20) {
      width.value = withSpring(Math.max(barcodeBox.size.width + 24, 120), { damping: 14 });
      height.value = withSpring(Math.max(barcodeBox.size.height + 24, 80), { damping: 14 });
    } else {
      width.value = withSpring(defaultWidth, { damping: 14 });
      height.value = withSpring(defaultHeight, { damping: 14 });
    }
  }, [barcodeBox, defaultWidth, defaultHeight, width, height]);

  const animatedFrameStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      statusAnim.value,
      [0, 1, 2],
      ['rgba(255, 255, 255, 0.85)', 'rgba(34, 197, 94, 0.95)', 'rgba(239, 68, 68, 0.95)']
    );

    return {
      width: width.value,
      height: height.value,
      transform: [{ scale: pulse.value }],
      borderColor,
    };
  });

  const animatedCornerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      statusAnim.value,
      [0, 1, 2],
      ['#ffffff', '#22c55e', '#ef4444']
    );

    return {
      borderColor,
    };
  });

  return (
    <Animated.View style={[styles.reticleContainer, animatedFrameStyle]}>
      {/* 4 Cyber-minimalist corner brackets */}
      <Animated.View style={[styles.corner, styles.cornerTL, animatedCornerStyle]} />
      <Animated.View style={[styles.corner, styles.cornerTR, animatedCornerStyle]} />
      <Animated.View style={[styles.corner, styles.cornerBL, animatedCornerStyle]} />
      <Animated.View style={[styles.corner, styles.cornerBR, animatedCornerStyle]} />

      {/* Subtle targeting center reticle dot */}
      <View style={styles.centerDot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  reticleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  centerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
