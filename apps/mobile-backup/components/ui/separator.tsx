import React from 'react'
import { View, ViewProps, StyleSheet } from 'react-native'
import { useTheme } from '../../lib/theme-context'

export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical'
}

const Separator = React.forwardRef<View, SeparatorProps>(
  ({ orientation = 'horizontal', style, ...props }, ref) => {
    const { colors } = useTheme()

    const styles = StyleSheet.create({
      horizontal: {
        height: 1,
        width: '100%',
        backgroundColor: colors.border,
      },
      vertical: {
        width: 1,
        height: '100%',
        backgroundColor: colors.border,
      },
    })

    return (
      <View
        ref={ref}
        style={[
          orientation === 'horizontal' ? styles.horizontal : styles.vertical,
          style,
        ]}
        {...props}
      />
    )
  }
)

Separator.displayName = 'Separator'

export { Separator } 