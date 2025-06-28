import React, { useState } from 'react'
import { View, SafeAreaView, StyleSheet, Dimensions, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Text } from '../../components/ui/text'
import { Button } from '../../components/ui/button'
import { Puzzle, Zap, Shield, TrendingUp } from 'lucide-react-native'
import { useTheme } from '../../lib/theme-context'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

const onboardingData = [
  {
    id: 1,
    title: 'Welcome to Cenety',
    description: 'Your all-in-one SaaS platform for modern business management and growth.',
    icon: Puzzle,
    color: '#3b82f6',
  },
  {
    id: 2,
    title: 'Powerful Features',
    description: 'Analytics, user management, billing, and everything you need to scale your business.',
    icon: Zap,
    color: '#8b5cf6',
  },
  {
    id: 3,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with 99.9% uptime. Your data is safe with us.',
    icon: Shield,
    color: '#22c55e',
  },
  {
    id: 4,
    title: 'Scale Your Business',
    description: 'Built to grow with you. From startup to enterprise, we have the tools you need.',
    icon: TrendingUp,
    color: '#f59e0b',
  },
]

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { colors } = useTheme()

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width)
    setCurrentIndex(slideIndex)
  }

  const isLastSlide = currentIndex === onboardingData.length - 1

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true')
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Error saving onboarding status:', error)
      router.replace('/(auth)/login')
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    slide: {
      width,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    description: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 320,
    },
    footer: {
      paddingHorizontal: 40,
      paddingBottom: 60,
      paddingTop: 20,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.mutedForeground,
      opacity: 0.3,
    },
    activeDot: {
      width: 24,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      opacity: 1,
    },
    buttonContainer: {
      gap: 12,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
      borderRadius: 8,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.foreground,
      fontSize: 16,
      fontWeight: '500',
    },
    skipButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      zIndex: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    skipButtonText: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontWeight: '500',
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      {!isLastSlide && (
        <Button 
          onPress={handleFinishOnboarding}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </Button>
      )}

      {/* Slides */}
      <ScrollView
        style={styles.scrollView}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {onboardingData.map((item) => {
          const IconComponent = item.icon
          return (
            <View key={item.id} style={styles.slide}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <IconComponent size={48} color={item.color} />
              </View>
              
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isLastSlide ? (
            <>
              <Button
                onPress={handleFinishOnboarding}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </Button>
              
              <Button
                onPress={() => {
                  handleFinishOnboarding()
                  setTimeout(() => router.replace('/(auth)/register'), 100)
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </Button>
            </>
          ) : (
            <Button
              onPress={() => router.replace('/(auth)/login')}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
} 