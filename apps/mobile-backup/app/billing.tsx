import React, { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, Linking } from 'react-native'
import { router } from 'expo-router'
import { Text } from '../components/ui/text'
import { Button } from '../components/ui/button'
import { Header } from '../components/layout/header'
import { useTheme } from '../lib/theme-context'
import { useAuth } from '../lib/auth-context'
import { 
  CreditCard, 
  Check, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Shield,
  ExternalLink,
  RefreshCw,
  Eye
} from 'lucide-react-native'
import { getUserSubscriptionPlan, UserSubscriptionPlan, formatPrice, getAnnualPriceText } from '../lib/billing-service'
import { formatDistanceToNow } from 'date-fns'

export default function BillingScreen() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const [subscriptionPlan, setSubscriptionPlan] = useState<UserSubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionData()
    }
  }, [user?.id])

  const fetchSubscriptionData = async () => {
    if (!user?.id) return

    try {
      setError(null)
      const result = await getUserSubscriptionPlan(user.id)
      
      if (result.success && result.data) {
        setSubscriptionPlan(result.data)
      } else {
        setError(result.error || 'Failed to fetch subscription data')
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSubscriptionData()
  }

  const handleViewPlans = () => {
    router.push('/plans')
  }

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'This will open the Stripe Customer Portal in your browser to manage your subscription, billing details, and payment methods.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Portal', 
          onPress: () => {
            // In a real app, this would open the Stripe Customer Portal
            Alert.alert('Demo Mode', 'This is a demo app. In production, this would open the Stripe Customer Portal.')
          }
        }
      ]
    )
  }

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help with your subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email Support', 
          onPress: () => {
            Linking.openURL('mailto:support@example.com?subject=Billing Support')
          }
        }
      ]
    )
  }

  const formatNextBillingDate = (timestamp: number): string => {
    if (!timestamp) return 'N/A'
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    loadingText: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginTop: 12,
    },
    errorContainer: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      marginBottom: 24,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.destructive,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    retryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    planTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
    },
    planBadge: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    planBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    planDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginBottom: 16,
    },
    planDetails: {
      gap: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.mutedForeground,
      flex: 1,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 12,
    },
    actionButtonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    actionButtonTextSecondary: {
      color: colors.foreground,
    },
    alertCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: '#f59e0b',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    alertText: {
      fontSize: 14,
      color: colors.foreground,
      flex: 1,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 8,
    },
    refreshButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
  })

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Billing" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading billing information...</Text>
        </View>
      </View>
    )
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Billing" showBackButton={true} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.errorContainer}>
              <AlertCircle size={48} color={colors.destructive} />
              <Text style={styles.errorTitle}>Failed to load billing information</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={fetchSubscriptionData}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  if (!subscriptionPlan) {
    return (
      <View style={styles.container}>
        <Header title="Billing" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No subscription data available</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header title="Billing" showBackButton={true} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Demo Alert */}
          <View style={styles.alertCard}>
            <AlertCircle size={20} color="#f59e0b" />
            <Text style={styles.alertText}>
              This is a demo app using Stripe test environment. You can find test card numbers in the Stripe documentation.
            </Text>
          </View>

          {/* Current Plan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Plan</Text>
            <View style={styles.card}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{subscriptionPlan.title}</Text>
                {subscriptionPlan.isPaid && (
                  <View style={styles.planBadge}>
                    <Check size={12} color={colors.primaryForeground} />
                    <Text style={styles.planBadgeText}>Active</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.planDescription}>{subscriptionPlan.description}</Text>
              
              <View style={styles.planDetails}>
                <View style={styles.detailRow}>
                  <DollarSign size={16} color={colors.mutedForeground} />
                  <Text style={styles.detailLabel}>Price</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.detailValue}>
                      {subscriptionPlan.isPaid 
                        ? formatPrice(
                            subscriptionPlan.interval === 'month' 
                              ? subscriptionPlan.prices.monthly 
                              : subscriptionPlan.prices.yearly,
                            subscriptionPlan.interval === 'month' ? 'monthly' : 'yearly'
                          )
                        : 'Free'
                      }
                    </Text>
                    {subscriptionPlan.isPaid && subscriptionPlan.interval === 'year' && (
                      <Text style={[styles.detailValue, { fontSize: 12, color: colors.mutedForeground, marginTop: 2 }]}>
                        {getAnnualPriceText(subscriptionPlan.prices.yearly, 'yearly')}
                      </Text>
                    )}
                  </View>
                </View>

                {subscriptionPlan.isPaid && (
                  <>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color={colors.mutedForeground} />
                      <Text style={styles.detailLabel}>Billing Cycle</Text>
                      <Text style={styles.detailValue}>
                        {subscriptionPlan.interval === 'month' ? 'Monthly' : 'Yearly'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Calendar size={16} color={colors.mutedForeground} />
                      <Text style={styles.detailLabel}>Next Billing</Text>
                      <Text style={styles.detailValue}>
                        {formatNextBillingDate(subscriptionPlan.stripeCurrentPeriodEnd)}
                      </Text>
                    </View>
                  </>
                )}

                <View style={styles.detailRow}>
                  <Shield size={16} color={colors.mutedForeground} />
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>
                    {subscriptionPlan.isPaid ? 'Active' : 'Free Plan'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manage Subscription</Text>
            
            <Pressable style={styles.actionButton} onPress={handleViewPlans}>
              <Eye size={16} color={colors.primaryForeground} />
              <Text style={styles.actionButtonText}>View All Plans</Text>
            </Pressable>

            {subscriptionPlan.isPaid && (
              <Pressable 
                style={[styles.actionButton, styles.actionButtonSecondary]} 
                onPress={handleManageSubscription}
              >
                <CreditCard size={16} color={colors.foreground} />
                <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                  Manage Subscription
                </Text>
              </Pressable>
            )}

            <Pressable 
              style={[styles.actionButton, styles.actionButtonSecondary]} 
              onPress={handleContactSupport}
            >
              <ExternalLink size={16} color={colors.foreground} />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                Contact Support
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  )
} 