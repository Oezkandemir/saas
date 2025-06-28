import React from 'react'
import { View, ViewProps, StyleSheet } from 'react-native'
import { Text } from './text'
import { useTheme } from '../../lib/theme-context'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva('', {
  variants: {
    variant: {
      default: 'default',
      secondary: 'secondary',
      destructive: 'destructive',
      outline: 'outline',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
  children: React.ReactNode
}

const Badge = React.forwardRef<View, BadgeProps>(
  ({ variant = 'default', children, style, ...props }, ref) => {
    const { colors } = useTheme()

    const getVariantStyles = () => {
      switch (variant) {
        case 'secondary':
          return {
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
          }
        case 'destructive':
          return {
            backgroundColor: colors.destructive,
            borderColor: colors.destructive,
          }
        case 'outline':
          return {
            backgroundColor: 'transparent',
            borderColor: colors.border,
            borderWidth: 1,
          }
        default:
          return {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          }
      }
    }

    const getTextColor = () => {
      switch (variant) {
        case 'secondary':
          return colors.secondaryForeground
        case 'destructive':
          return colors.destructiveForeground
        case 'outline':
          return colors.foreground
        default:
          return colors.primaryForeground
      }
    }

    const styles = StyleSheet.create({
      badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        ...getVariantStyles(),
      },
      text: {
        fontSize: 12,
        fontWeight: '500',
        color: getTextColor(),
        fontFamily: 'System',
      },
    })

    return (
      <View ref={ref} style={[styles.badge, style]} {...props}>
        <Text style={styles.text}>{children}</Text>
      </View>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge } 