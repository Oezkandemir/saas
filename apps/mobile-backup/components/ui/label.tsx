import React from 'react'
import { Text, TextProps, StyleSheet } from 'react-native'
import { useTheme } from '../../lib/theme-context'

export interface LabelProps extends TextProps {
  required?: boolean
  error?: boolean
}

const Label = React.forwardRef<Text, LabelProps>(
  ({ required = false, error = false, children, style, ...props }, ref) => {
    const { colors } = useTheme()

    const styles = StyleSheet.create({
      label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
        marginBottom: 8,
        fontFamily: 'System',
      },
      error: {
        color: colors.destructive,
      },
    })

    return (
      <Text
        ref={ref}
        style={[styles.label, error && styles.error, style]}
        {...props}
      >
        {children}
        {required && (
          <Text style={{ color: colors.destructive }}> *</Text>
        )}
      </Text>
    )
  }
)

Label.displayName = 'Label'

export { Label } 