import React from 'react'
import { View, ScrollView, StyleSheet, Pressable, Linking } from 'react-native'
import { router } from 'expo-router'
import { Text } from '../../components/ui/text'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { Header } from '../../components/layout/header'
import { 
  Smartphone, 
  Zap, 
  Shield, 
  Users, 
  Star,
  Github,
  ArrowRight,
  Globe,
  Code,
  Palette,
  Settings,
  Database,
  Lock
} from 'lucide-react-native'
import { useTheme } from '../../lib/theme-context'

export default function HomeScreen() {
  const { colors } = useTheme()

  const features = [
    {
      title: 'React Native & Expo',
      description: 'Built with the latest Expo SDK and React Native for native performance',
      icon: Smartphone,
      color: '#3b82f6',
    },
    {
      title: 'Lightning Fast',
      description: 'Optimized performance with native components and efficient rendering',
      icon: Zap,
      color: '#f59e0b',
    },
    {
      title: 'Secure by Design',
      description: 'Enterprise-grade security with Supabase authentication',
      icon: Shield,
      color: '#22c55e',
    },
    {
      title: 'Real-time Updates',
      description: 'Live data synchronization and push notifications',
      icon: Globe,
      color: '#8b5cf6',
    },
    {
      title: 'Modern UI/UX',
      description: 'Beautiful, responsive design with dark/light theme support',
      icon: Palette,
      color: '#ec4899',
    },
    {
      title: 'Developer Ready',
      description: 'TypeScript, ESLint, and comprehensive documentation',
      icon: Code,
      color: '#10b981',
    },
  ]

  const stats = [
    { label: 'Native Performance', value: '60 FPS' },
    { label: 'Cross Platform', value: 'iOS & Android' },
    { label: 'Bundle Size', value: '< 50MB' },
    { label: 'Load Time', value: '< 2s' },
  ]

  const handleGitHub = () => {
    Linking.openURL('https://github.com/mickasmt/next-saas-stripe-starter')
  }

  const handleDashboard = () => {
    router.navigate('/(tabs)' as any)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 32,
    },
    badge: {
      marginBottom: 16,
      alignSelf: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 36,
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
      width: '100%',
    },
    actionButton: {
      flex: 1,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 32,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 16,
    },
    featuresGrid: {
      gap: 16,
    },
    featureCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      lineHeight: 20,
    },
    ctaSection: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      marginBottom: 32,
    },
    ctaTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 8,
      textAlign: 'center',
    },
    ctaDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 16,
    },
    ctaButton: {
      width: '100%',
    },
  })

  return (
    <View style={styles.container}>
      <Header title="Home" showLogo={true} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <Badge style={styles.badge}>
              <Text>🚀 Native Mobile Experience</Text>
            </Badge>
            
            <Text style={styles.title}>
              Next-Gen SaaS{'\n'}Mobile Starter
            </Text>
            
            <Text style={styles.subtitle}>
              Built with Expo & React Native. Ready for production with authentication, payments, and real-time features.
            </Text>

            <View style={styles.actionButtons}>
              <Button 
                style={styles.actionButton}
                onPress={handleDashboard}
              >
                <>
                  <Text style={{ color: colors.primaryForeground, marginRight: 8 }}>Go to Dashboard</Text>
                  <ArrowRight size={16} color={colors.primaryForeground} />
                </>
              </Button>
              
              <Button 
                variant="outline"
                style={styles.actionButton}
                onPress={handleGitHub}
              >
                <>
                  <Github size={16} color={colors.foreground} />
                  <Text style={{ color: colors.foreground, marginLeft: 8 }}>GitHub</Text>
                </>
              </Button>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Makes It Special</Text>
            
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <View key={index} style={styles.featureCard}>
                    <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                      <IconComponent size={24} color={feature.color} />
                    </View>
                    
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Ready to Build Something Amazing?</Text>
            <Text style={styles.ctaDescription}>
              Start building your next SaaS app with our mobile-first starter template
            </Text>
            <Button 
              style={styles.ctaButton}
              onPress={handleDashboard}
            >
              <Text>Get Started Now</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
} 