import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text } from './ui/text'
import { Sun, Moon, Monitor } from 'lucide-react-native'
import { useTheme } from '../lib/theme-context'

export function ThemeToggle() {
  const { theme, setTheme, colors } = useTheme()

  const themes = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Monitor },
  ] as const

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 2,
    },
    option: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      gap: 6,
    },
    activeOption: {
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    optionText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.mutedForeground,
    },
    activeOptionText: {
      color: colors.foreground,
    },
  })

  return (
    <View style={styles.container}>
      {themes.map((themeOption) => {
        const IconComponent = themeOption.icon
        const isActive = theme === themeOption.key
        
        return (
          <Pressable
            key={themeOption.key}
            style={[
              styles.option,
              isActive && styles.activeOption,
            ]}
            onPress={() => setTheme(themeOption.key)}
          >
            <IconComponent 
              size={14} 
              color={isActive ? colors.foreground : colors.mutedForeground} 
            />
            <Text 
              style={[
                styles.optionText,
                isActive && styles.activeOptionText,
              ]}
            >
              {themeOption.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
} 