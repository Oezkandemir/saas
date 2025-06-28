import React from 'react'
import { View, ViewProps, StyleSheet, Text as RNText } from 'react-native'
import { Text } from './text'
import { Label } from './label'
import { useTheme } from '../../lib/theme-context'

export interface FormItemProps extends ViewProps {
  children: React.ReactNode
}

export interface FormLabelProps extends React.ComponentProps<typeof Label> {}

export interface FormControlProps extends ViewProps {
  children: React.ReactNode
}

export interface FormDescriptionProps extends React.ComponentProps<typeof Text> {}

export interface FormMessageProps extends React.ComponentProps<typeof Text> {
  error?: boolean
}

const FormItem = React.forwardRef<View, FormItemProps>(
  ({ children, style, ...props }, ref) => {
    const styles = StyleSheet.create({
      container: {
        marginBottom: 20,
      },
    })

    return (
      <View ref={ref} style={[styles.container, style]} {...props}>
        {children}
      </View>
    )
  }
)
FormItem.displayName = 'FormItem'

const FormLabel = React.forwardRef<RNText, FormLabelProps>(
  ({ ...props }, ref) => {
    return <Label ref={ref as any} {...props} />
  }
)
FormLabel.displayName = 'FormLabel'

const FormControl = React.forwardRef<View, FormControlProps>(
  ({ children, style, ...props }, ref) => {
    return (
      <View ref={ref} style={style} {...props}>
        {children}
      </View>
    )
  }
)
FormControl.displayName = 'FormControl'

const FormDescription = React.forwardRef<RNText, FormDescriptionProps>(
  ({ style, ...props }, ref) => {
    const { colors } = useTheme()

    const styles = StyleSheet.create({
      description: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 4,
        fontFamily: 'System',
      },
    })

    return (
      <Text ref={ref as any} style={[styles.description, style]} {...props} />
    )
  }
)
FormDescription.displayName = 'FormDescription'

const FormMessage = React.forwardRef<RNText, FormMessageProps>(
  ({ error = false, style, ...props }, ref) => {
    const { colors } = useTheme()

    const styles = StyleSheet.create({
      message: {
        fontSize: 12,
        marginTop: 4,
        fontFamily: 'System',
        color: error ? colors.destructive : colors.mutedForeground,
      },
    })

    return (
      <Text ref={ref as any} style={[styles.message, style]} {...props} />
    )
  }
)
FormMessage.displayName = 'FormMessage'

export {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} 