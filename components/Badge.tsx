import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export interface BadgeProps {
  label: string;
  variant: 'default' | 'success' | 'warning';
}

const variantStyles = {
  default: {
    backgroundColor: theme.colors.border,
    color: theme.colors.textPrimary,
  },
  success: {
    backgroundColor: theme.colors.success + '20',
    color: theme.colors.success,
  },
  warning: {
    backgroundColor: theme.colors.warning + '20',
    color: theme.colors.warning,
  },
} as const;

export function Badge({ label, variant }: BadgeProps) {
  const { backgroundColor, color } = variantStyles[variant];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label.slice(0, 20)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
});
