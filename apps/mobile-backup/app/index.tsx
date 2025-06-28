import React, { useEffect, useState } from 'react'
import { View, SafeAreaView, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Text } from '../components/ui/text'
import { useAuth } from '../lib/auth-context'
import { useTheme } from '../lib/theme-context'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function WelcomeScreen() {
  const { isAuthenticated, loading } = useAuth()
  const { colors } = useTheme()
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null)
  const [minLoadingTime, setMinLoadingTime] = useState(true)

  useEffect(() => {
    checkOnboardingStatus()
    
    // Minimum loading time of 2 seconds to show the themed screen
    const timer = setTimeout(() => {
      setMinLoadingTime(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Only navigate when both loading is done and minimum time has passed
    if (!loading && hasSeenOnboarding !== null && !minLoadingTime) {
      // Add a small delay to ensure navigation context is fully ready
      const navigationTimer = setTimeout(() => {
        try {
          if (isAuthenticated) {
            router.replace('/(tabs)')
          } else if (hasSeenOnboarding) {
            router.replace('/(auth)/login')
          } else {
            router.replace('./onboarding')
          }
        } catch (error) {
          console.error('Navigation error:', error)
        }
      }, 100)

      return () => clearTimeout(navigationTimer)
    }
  }, [loading, isAuthenticated, hasSeenOnboarding, minLoadingTime])

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding')
      setHasSeenOnboarding(hasSeenOnboarding === 'true')
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setHasSeenOnboarding(false)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 16,
      marginBottom: 24,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    appName: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 8,
      textAlign: 'center',
    },
    appTagline: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 32,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 16,
      color: colors.mutedForeground,
    },
  })

  // Get logo source safely
  let logoSource;
  try {
    logoSource = require('../assets/logo.png');
  } catch (error) {
    console.warn('Logo not found, using placeholder');
    logoSource = null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        {logoSource ? (
          <Image
            source={logoSource}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.logo} />
        )}
        <Text style={styles.appName}>Cenety Mobile</Text>
        <Text style={styles.appTagline}>Next-Gen SaaS Mobile Experience</Text>
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </SafeAreaView>
  )
} 