import { memo } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '../../../components/AppThemeProvider';
import type { ProductMetric } from '../../../utils/productInsights';
import { getToneColor } from './resultScreenHelpers';
import { metricChipStyles } from './resultScreenStyles';

export const MetricChip = memo(function MetricChip({ metric }: { metric: ProductMetric }) {
  const { colors } = useAppTheme();
  const toneColor = getToneColor(colors, metric.tone);

  return (
    <View
      style={[
        metricChipStyles.chip,
        {
          backgroundColor: colors.background,
          borderColor: toneColor,
        },
      ]}
    >
      <Text style={[metricChipStyles.label, { color: colors.textMuted }]}>{metric.label}</Text>
      <Text style={[metricChipStyles.value, { color: toneColor }]}>
        {metric.value}
      </Text>
    </View>
  );
});

export default MetricChip;
