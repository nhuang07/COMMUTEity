import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  size?: 'default' | 'large';
}

export function Button({
  label,
  onPress,
  variant,
  disabled = false,
  size = 'default',
}: ButtonProps) {
  const containerStyle: ViewStyle[] = [
    styles.base,
    variantStyles[variant].container,
    size === 'large' && styles.large,
    disabled && styles.disabledContainer,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.label,
    variantStyles[variant].label,
    disabled && styles.disabledLabel,
  ].filter(Boolean) as TextStyle[];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  large: {
    minHeight: 48,
    minWidth: 48,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  disabledContainer: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.disabled,
    opacity: 0.6,
  },
  disabledLabel: {
    color: theme.colors.textSecondary,
  },
});

const variantStyles = {
  primary: StyleSheet.create({
    container: {
      backgroundColor: theme.colors.primary,
    },
    label: {
      color: theme.colors.surface,
    },
  }),
  secondary: StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    label: {
      color: theme.colors.primary,
    },
  }),
  destructive: StyleSheet.create({
    container: {
      backgroundColor: theme.colors.destructive,
    },
    label: {
      color: theme.colors.surface,
    },
  }),
};
