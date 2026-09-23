import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type StatusGlyphType = 'safe' | 'caution' | 'danger';

interface StatusGlyphBadgeProps {
  status: StatusGlyphType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG = {
  safe: {
    bg: '#ECFDF5',
    border: '#10B981',
    text: '#065F46',
    iconName: 'checkmark-circle' as const,
    defaultLabel: 'SAFE',
  },
  caution: {
    bg: '#FFFBEB',
    border: '#F59E0B',
    text: '#92400E',
    iconName: 'alert-circle' as const,
    defaultLabel: 'CAUTION',
  },
  danger: {
    bg: '#FEF2F2',
    border: '#EF4444',
    text: '#991B1B',
    iconName: 'warning' as const,
    defaultLabel: 'ALLERGEN TRIGGER',
  },
};

const SIZES = {
  sm: { icon: 14, text: 11, padV: 3, padH: 8, gap: 4 },
  md: { icon: 18, text: 13, padV: 5, padH: 12, gap: 6 },
  lg: { icon: 22, text: 15, padV: 8, padH: 16, gap: 8 },
};

/**
 * Tri-factor accessible status badge.
 * Communicates safety through color, shape/glyph, and explicit text simultaneously.
 */
export const StatusGlyphBadge: React.FC<StatusGlyphBadgeProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const conf = CONFIG[status] || CONFIG.caution;
  const sz = SIZES[size] || SIZES.md;
  const displayText = label || conf.defaultLabel;

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Verdict: ${displayText}`}
      style={[
        styles.container,
        {
          backgroundColor: conf.bg,
          borderColor: conf.border,
          paddingVertical: sz.padV,
          paddingHorizontal: sz.padH,
          gap: sz.gap,
        },
      ]}
    >
      <Ionicons name={conf.iconName} size={sz.icon} color={conf.border} />
      <Text style={[styles.text, { color: conf.text, fontSize: sz.text }]}>
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
