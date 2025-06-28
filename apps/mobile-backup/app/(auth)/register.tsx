import React, { useState } from 'react'
import { View, SafeAreaView, Alert, ScrollView, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Text } from '../../components/ui/text'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { FormItem, FormLabel, FormControl, FormMessage } from '../../components/ui/form'
import { Puzzle, ChevronLeft } from 'lucide-react-native'
import { useAuth } from '../../lib/auth-context'
import { useTheme } from '../../lib/theme-context'

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const { signUp } = useAuth()
  const { colors } = useTheme()

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const { error } = await signUp(email, password)
      if (error) {
        Alert.alert('Registration Error', error.message || 'Failed to create account')
      } else {
        Alert.alert(
          'Account Created',
          'Please check your email for a confirmation link to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login')
            }
          ]
        )
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      top: 60,
      left: 16,
      zIndex: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: 8,
    },
    backButtonText: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: 120,
      paddingBottom: 40,
    },
    formContainer: {
      width: '100%',
      maxWidth: 350,
      alignSelf: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    logoContainer: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.025,
    },
    description: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
    },
    form: {
      gap: 16,
      marginBottom: 24,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    footerText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    footerLink: {
      fontSize: 14,
      color: '#3b82f6',
      textDecorationLine: 'underline',
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <Pressable 
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) {
            router.back()
          } else {
            router.replace('/onboarding')
          }
        }}
      >
        <ChevronLeft size={16} color={colors.mutedForeground} />
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Puzzle size={24} color="#3b82f6" />
            </View>
            <Text style={styles.title}>Create an account</Text>
            <Text style={styles.description}>
              Enter your email below to create your account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <FormItem>
              <FormLabel required>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
              </FormControl>
              {errors.email && <FormMessage error>{errors.email}</FormMessage>}
            </FormItem>

            <FormItem>
              <FormLabel required>Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  autoCorrect={false}
                />
              </FormControl>
              {errors.password && <FormMessage error>{errors.password}</FormMessage>}
            </FormItem>

            <FormItem>
              <FormLabel required>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  autoCorrect={false}
                />
              </FormControl>
              {errors.confirmPassword && <FormMessage error>{errors.confirmPassword}</FormMessage>}
            </FormItem>

            <Button
              onPress={handleRegister}
              disabled={loading}
            >
              <Text>
                {loading ? 'Creating account...' : 'Create Account'}
              </Text>
            </Button>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
} 