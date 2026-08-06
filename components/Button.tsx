import React from 'react';
import { ActivityIndicator, Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  size?: 'default' | 'large';
}

export function Button({
  label,
  onPress,
  variant,
  disabled = false,
  loading = false,
  size = 'default',
}: ButtonProps) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        v.container,
        size === 'large' && styles.large,
        pressed && !isDisabled && [v.pressedContainer, styles.pressedScale],
        disabled && styles.disabledContainer,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={v.label.color as string} />
      ) : (
        <Text style={[styles.label, v.label, disabled && styles.disabledLabel] as TextStyle[]}>
          {label}
        </Text>
      )}
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  large: {
    minHeight: 48,
    minWidth: 48,
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: -0.1,
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

const variantStyles: Record<
  ButtonProps['variant'],
  { container: ViewStyle; pressedContainer: ViewStyle; label: TextStyle }
> = {
  primary: {
    container: {
      backgroundColor: theme.colors.primary,
    },
    pressedContainer: {
      backgroundColor: theme.colors.primaryPressed,
    },
    label: {
      color: theme.colors.primaryForeground,
    },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.borderStrong,
    },
    pressedContainer: {
      backgroundColor: theme.colors.surfaceRaised,
    },
    label: {
      color: theme.colors.textPrimary,
    },
  },
  destructive: {
    container: {
      backgroundColor: theme.colors.destructive,
    },
    pressedContainer: {
      backgroundColor: '#C43A3E',
    },
    label: {
      color: theme.colors.primaryForeground,
    },
  },
};
