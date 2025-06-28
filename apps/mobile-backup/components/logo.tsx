import React from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { Text } from './ui/text'
import { useTheme } from '../lib/theme-context'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

export function Logo({ size = 'medium', showText = true }: LogoProps) {
  const { colors } = useTheme()

  const sizes = {
    small: {
      container: 32,
      text: 12,
      logoText: 8,
    },
    medium: {
      container: 56,
      text: 20,
      logoText: 10,
    },
    large: {
      container: 80,
      text: 28,
      logoText: 48,
    }
  }

  const currentSize = sizes[size]

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: showText ? 8 : 0,
    },
    logoContainer: {
      width: currentSize.container,
      height: currentSize.container,
      borderRadius: currentSize.container / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    logoText: {
      fontSize: currentSize.logoText,
      fontWeight: '700',
      color: colors.primaryForeground,
    },
    logoImage: {
      width: '80%',
      height: '80%',
    },
    brandText: {
      fontSize: currentSize.text,
      fontWeight: '600',
      color: colors.foreground,
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <Text style={styles.brandText}>Cenety</Text>
      )}
    </View>
  )
} 