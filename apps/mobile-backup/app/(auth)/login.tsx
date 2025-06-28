import React, { useState } from 'react'
import { View, SafeAreaView, Alert, ScrollView, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Text } from '../../components/ui/text'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { FormItem, FormLabel, FormControl, FormMessage } from '../../components/ui/form'
import { Puzzle, ChevronLeft } from 'lucide-react-native'
import { useAuth } from '../../lib/auth-context'
import { useTheme } from '../../lib/theme-context'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { colors } = useTheme()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        Alert.alert('Login Error', error.message || 'Failed to sign in')
      } else {
        // Navigation is handled by the auth context
        router.replace('/(tabs)')
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
    inputGroup: {
      gap: 4,
    },
    input: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.foreground,
      backgroundColor: colors.card,
    },
    submitButton: {
      height: 44,
      backgroundColor: colors.primary,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: colors.primaryForeground,
      fontSize: 14,
      fontWeight: '500',
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.description}>
              Enter your email to sign in to your account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <FormItem>
              <FormLabel>Email</FormLabel>
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
            </FormItem>

            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </FormControl>
            </FormItem>

            <Button
              onPress={handleLogin}
              disabled={loading}
            >
              <Text>
                {loading ? 'Signing in...' : 'Sign In with Email'}
              </Text>
            </Button>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
} 