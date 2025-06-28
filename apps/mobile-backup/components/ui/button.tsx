import * as React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './text';
import { useTheme } from '../../lib/theme-context';

interface ButtonProps extends React.ComponentProps<typeof Pressable> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

function Button({ 
  variant = 'default', 
  size = 'default', 
  children, 
  style, 
  disabled,
  ...props 
}: ButtonProps) {
  const { colors } = useTheme();
  
  const getButtonStyle = () => {
    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 8,
      minHeight: getSizeStyle().minHeight,
      paddingHorizontal: getSizeStyle().paddingHorizontal,
      paddingVertical: getSizeStyle().paddingVertical,
    };

    switch (variant) {
      case 'default':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'destructive':
        return {
          ...baseStyle,
          backgroundColor: colors.destructive,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'link':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return {
          minHeight: 32,
          paddingHorizontal: 12,
          paddingVertical: 6,
        };
      case 'lg':
        return {
          minHeight: 48,
          paddingHorizontal: 20,
          paddingVertical: 12,
        };
      case 'icon':
        return {
          minHeight: 40,
          paddingHorizontal: 0,
          paddingVertical: 0,
          width: 40,
        };
      default:
        return {
          minHeight: 40,
          paddingHorizontal: 16,
          paddingVertical: 8,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'default':
        return colors.primaryForeground;
      case 'destructive':
        return colors.destructiveForeground;
      case 'outline':
        return colors.foreground;
      case 'secondary':
        return colors.secondaryForeground;
      case 'ghost':
        return colors.foreground;
      case 'link':
        return colors.primary;
      default:
        return colors.primaryForeground;
    }
  };

  const buttonStyle = [
    getButtonStyle(),
    disabled && { opacity: 0.5 },
    style,
  ];

  const textStyle = {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    color: getTextColor(),
    opacity: disabled ? 0.7 : 1,
    ...(variant === 'link' && { textDecorationLine: 'underline' as const }),
  };

  return (
    <Pressable
      style={({ pressed }) => [
        ...buttonStyle,
        pressed && { opacity: 0.8 },
      ]}
      disabled={disabled}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={textStyle}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export { Button };
export type { ButtonProps };
