import React from 'react'
import { View, StyleSheet, Pressable, SafeAreaView, StatusBar } from 'react-native'
import { router } from 'expo-router'
import { Text } from './ui/text'
import { ArrowLeft, Sun, Moon } from 'lucide-react-native'
import { useAuth } from '../lib/auth-context'
import { useTheme } from '../lib/theme-context'
import { Logo } from './logo'
import { UserAvatar } from './user-avatar'

interface DefaultHeaderProps {
  title: string
  showBackButton?: boolean
  showLogo?: boolean
}

export function DefaultHeader({ title, showBackButton = true, showLogo = false }: DefaultHeaderProps) {
  const { user } = useAuth()
  const { colors, isDark, setTheme, theme } = useTheme()

  const handleThemeToggle = () => {
    if (theme === 'system') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back()
    }
  }

  const styles = StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    centerSection: {
      flex: 2,
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1,
      gap: 12,
    },
    themeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <Pressable 
              style={styles.backButton}
              onPress={handleGoBack}
            >
              <ArrowLeft size={20} color={colors.foreground} />
            </Pressable>
          )}
          {showLogo && (
            <Logo size="small" showText={false} />
          )}
        </View>

        <View style={styles.centerSection}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightSection}>
          <Pressable 
            style={styles.themeButton}
            onPress={handleThemeToggle}
          >
            {isDark ? (
              <Sun size={18} color={colors.foreground} />
            ) : (
              <Moon size={18} color={colors.foreground} />
            )}
          </Pressable>

          <UserAvatar user={user || undefined} size="small" />
        </View>
      </View>
    </SafeAreaView>
  )
} 