import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated';
}

export function Card({ children, title, subtitle, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.container, variant === 'elevated' ? styles.elevated : styles.default]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title.slice(0, 100)}
            </Text>
          )}
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle.slice(0, 200)}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  default: {
    ...theme.shadow.sm,
  },
  elevated: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.borderStrong,
    ...theme.shadow.md,
  },
  header: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fontFamilyDisplay.semibold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.normal,
    color: theme.colors.textSecondary,
  },
});
