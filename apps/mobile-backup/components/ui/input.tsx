import React from 'react'
import { TextInput, TextInputProps, StyleSheet } from 'react-native'
import { useTheme } from '../../lib/theme-context'
import clsx from 'clsx'

export interface InputProps extends TextInputProps {
  className?: string
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, ...props }, ref) => {
    const { colors, isDark } = useTheme()

    const styles = StyleSheet.create({
      input: {
        height: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.foreground,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        fontFamily: 'System',
      },
      focused: {
        borderColor: colors.ring,
        borderWidth: 2,
      },
      disabled: {
        opacity: 0.5,
        backgroundColor: colors.muted,
      },
    })

    return (
      <TextInput
        ref={ref}
        style={[
          styles.input,
          props.editable === false && styles.disabled,
        ]}
        placeholderTextColor={colors.mutedForeground}
        selectionColor={colors.primary}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input } 