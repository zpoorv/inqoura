import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from './AppThemeProvider';
import type { ProductSearchResult } from '../services/productSearchService';

type ProductSearchResultRowProps = {
  onPress: (result: ProductSearchResult) => void;
  result: ProductSearchResult;
};

export default function ProductSearchResultRow({
  onPress,
  result,
}: ProductSearchResultRowProps) {
  const { colors, typography } = useAppTheme();
  const styles = createStyles(colors, typography);

  return (
    <Pressable onPress={() => onPress(result)} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{result.product.name}</Text>
        <Text style={styles.badge}>
          {result.sourceLabel === 'saved' ? 'Saved' : 'Catalog'}
        </Text>
      </View>
      {result.product.brand ? <Text style={styles.meta}>{result.product.brand}</Text> : null}
      <Text style={styles.summary}>
        {result.product.categories.slice(0, 2).join(' • ') || result.product.barcode}
      </Text>
      {result.isFavorite ? <Text style={styles.favorite}>Favorite</Text> : null}
    </Pressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  typography: ReturnType<typeof useAppTheme>['typography']
) =>
  StyleSheet.create({
    badge: {
      color: colors.primary,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 6,
      padding: 16,
    },
    favorite: {
      color: colors.warning,
      fontFamily: typography.accentFontFamily,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    meta: {
      color: colors.text,
      fontFamily: typography.bodyFontFamily,
      fontSize: 14,
    },
    summary: {
      color: colors.textMuted,
      fontFamily: typography.bodyFontFamily,
      fontSize: 13,
      lineHeight: 19,
    },
    title: {
      color: colors.text,
      flex: 1,
      fontFamily: typography.headingFontFamily,
      fontSize: 15,
      fontWeight: '700',
    },
  });
