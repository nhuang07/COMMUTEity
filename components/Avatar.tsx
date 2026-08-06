import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { getAvatarInitial } from '../utils/avatar';

export interface AvatarProps {
  name: string;
  imageUri?: string;
  size?: number;
}

const DEFAULT_SIZE = 48;

export function Avatar({ name, imageUri, size = DEFAULT_SIZE }: AvatarProps) {
  const borderRadius = size / 2;
  const fontSize = size * 0.4;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: theme.colors.primary,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Avatar for ${name}`}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius,
            },
          ]}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text
          style={[
            styles.initial,
            { fontSize },
          ]}
        >
          {getAvatarInitial(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initial: {
    color: theme.colors.surface,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
});
