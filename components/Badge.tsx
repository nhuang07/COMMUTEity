import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export interface BadgeProps {
  label: string;
  variant: 'default' | 'success' | 'warning';
}

const variantStyles = {
  default: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    color: theme.colors.textSecondary,
  },
  success: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: theme.colors.accentMuted,
    color: theme.colors.accentMutedForeground,
  },
  warning: {
    backgroundColor: theme.colors.warning + '26',
    borderColor: theme.colors.warning + '4D',
    color: theme.colors.warning,
  },
} as const;

export function Badge({ label, variant }: BadgeProps) {
  const { backgroundColor, borderColor, color } = variantStyles[variant];

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label.slice(0, 20).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: 0.6,
  },
});
