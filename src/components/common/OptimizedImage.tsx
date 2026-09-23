import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image, type ImageProps } from 'expo-image';

export interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  blurhash?: string;
  aspectRatio?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export default function OptimizedImage({
  uri,
  blurhash = DEFAULT_BLURHASH,
  aspectRatio,
  style,
  containerStyle,
  contentFit = 'cover',
  transition = 200,
  ...restProps
}: OptimizedImageProps) {
  if (!uri) {
    return (
      <View style={[styles.fallbackContainer, aspectRatio ? { aspectRatio } : null, containerStyle]}>
        <Image
          placeholder={{ blurhash }}
          contentFit={contentFit}
          style={[StyleSheet.absoluteFillObject, style]}
          {...restProps}
        />
      </View>
    );
  }

  return (
    <View style={[aspectRatio ? { aspectRatio } : null, containerStyle]}>
      <Image
        source={{ uri }}
        placeholder={{ blurhash }}
        contentFit={contentFit}
        transition={transition}
        cachePolicy="memory-disk"
        style={style}
        {...restProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
});
