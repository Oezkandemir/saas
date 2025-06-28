import React, { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native'
import { Text } from '../components/ui/text'
import { Header } from '../components/layout/header'
import { useTheme } from '../lib/theme-context'
import { useAuth } from '../lib/auth-context'
import { 
  Check, 
  Star, 
  Shield, 
  Zap, 
  ArrowRight, 
  X,
  Crown,
  AlertCircle 
} from 'lucide-react-native'
import { 
  getAvailablePlans, 
  getUserSubscriptionPlan, 
  SubscriptionPlan, 
  UserSubscriptionPlan,
  formatPrice, 
  getAnnualPriceText,
  calculateYearlySavings 
} from '../lib/billing-service'

export default function PlansScreen() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const [plans] = useState<SubscriptionPlan[]>(getAvailablePlans())
  const [userPlan, setUserPlan] = useState<UserSubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [isYearly, setIsYearly] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchUserPlan()
    }
  }, [user?.id])

  const fetchUserPlan = async () => {
    if (!user?.id) return

    try {
      setError(null)
      const result = await getUserSubscriptionPlan(user.id)
      
      if (result.success && result.data) {
        setUserPlan(result.data)
      } else {
        setError(result.error || 'Failed to fetch user plan')
      }
    } catch (error) {
      console.error('Error fetching user plan:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    const selectedPriceId = plan.stripeIds[isYearly ? 'yearly' : 'monthly']
    const isCurrentPlan = userPlan?.stripePriceId === selectedPriceId

    if (isCurrentPlan) {
      Alert.alert('Current Plan', 'This is your current subscription plan.')
      return
    }

    if (plan.prices.monthly === 0) {
      Alert.alert('Free Plan', 'You are already on the free plan or this would downgrade your account.')
      return
    }

    Alert.alert(
      `Select ${plan.title} Plan`,
      `This will redirect you to Stripe to ${userPlan?.isPaid ? 'change your' : 'start a new'} subscription.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // In a real app, this would open Stripe checkout
            Alert.alert('Demo Mode', 'This is a demo app. In production, this would open Stripe checkout.')
          }
        }
      ]
    )
  }

  const getPlanIcon = (index: number) => {
    switch (index) {
      case 0: return Shield
      case 1: return Star
      case 2: return Crown
      default: return Star
    }
  }

  const isPlanCurrent = (plan: SubscriptionPlan): boolean => {
    const selectedPriceId = plan.stripeIds[isYearly ? 'yearly' : 'monthly']
    return userPlan?.stripePriceId === selectedPriceId
  }

  const isPlanRecommended = (plan: SubscriptionPlan): boolean => {
    return plan.title === 'Pro'
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
    errorText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    header: {
      marginBottom: 32,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.foreground,
      textAlign: 'center',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 24,
    },
    billingToggle: {
      flexDirection: 'row',
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 4,
      alignSelf: 'center',
    },
    billingOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      minWidth: 80,
    },
    billingOptionActive: {
      backgroundColor: colors.background,
    },
    billingOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    billingOptionTextActive: {
      color: colors.foreground,
    },
    savingsText: {
      fontSize: 12,
      color: colors.primary,
      textAlign: 'center',
      marginTop: 8,
    },
    plansContainer: {
      gap: 16,
    },
    planCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      position: 'relative',
    },
    planCardRecommended: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    planCardCurrent: {
      borderColor: '#10b981',
      borderWidth: 2,
      backgroundColor: '#f0fdf4',
    },
    recommendedBadge: {
      position: 'absolute',
      top: -12,
      left: 20,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    recommendedText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    currentBadge: {
      position: 'absolute',
      top: -12,
      right: 20,
      backgroundColor: '#10b981',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    currentText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    planHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    planIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    planTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 4,
    },
    planTitleCurrent: {
      fontSize: 20,
      fontWeight: '700',
      color: '#065f46', // Dark green text for light background
      marginBottom: 4,
    },
    planDescription: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 16,
    },
    planDescriptionCurrent: {
      fontSize: 14,
      color: '#047857', // Dark green text for light background
      textAlign: 'center',
      marginBottom: 16,
    },
    priceContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    price: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.foreground,
    },
    priceCurrent: {
      fontSize: 32,
      fontWeight: '700',
      color: '#065f46', // Dark green text for light background
    },
    priceSubtext: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    priceSubtextCurrent: {
      fontSize: 14,
      color: '#047857', // Dark green text for light background
    },
    annualPriceText: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginTop: 4,
    },
    annualPriceTextCurrent: {
      fontSize: 12,
      color: '#047857', // Dark green text for light background
      textAlign: 'center',
      marginTop: 4,
    },
    featuresContainer: {
      marginBottom: 24,
    },
    featuresTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 12,
    },
    featuresTitleCurrent: {
      fontSize: 16,
      fontWeight: '600',
      color: '#065f46', // Dark green text for light background
      marginBottom: 12,
    },
    featuresList: {
      gap: 8,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    featureText: {
      fontSize: 14,
      color: colors.foreground,
      flex: 1,
    },
    featureTextCurrent: {
      fontSize: 14,
      color: '#065f46', // Dark green text for light background
      flex: 1,
    },
    limitationsContainer: {
      marginBottom: 24,
    },
    limitationsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 12,
    },
    limitationsTitleCurrent: {
      fontSize: 16,
      fontWeight: '600',
      color: '#065f46', // Dark green text for light background
      marginBottom: 12,
    },
    limitationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    limitationText: {
      fontSize: 14,
      color: colors.mutedForeground,
      flex: 1,
    },
    limitationTextCurrent: {
      fontSize: 14,
      color: '#047857', // Dark green text for light background
      flex: 1,
    },
    selectButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    selectButtonCurrent: {
      backgroundColor: '#10b981',
    },
    selectButtonDisabled: {
      backgroundColor: colors.muted,
    },
    selectButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    selectButtonTextDisabled: {
      color: colors.mutedForeground,
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
  })

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Plans" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </View>
    )
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Plans" showBackButton={true} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // Calculate savings for yearly plans
  const proSavings = calculateYearlySavings(plans[1]?.prices.monthly || 0, plans[1]?.prices.yearly || 0)
  const businessSavings = calculateYearlySavings(plans[2]?.prices.monthly || 0, plans[2]?.prices.yearly || 0)

  return (
    <View style={styles.container}>
      <Header title="Plans" showBackButton={true} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Demo Alert */}
          <View style={styles.alertCard}>
            <AlertCircle size={20} color="#f59e0b" />
            <Text style={styles.alertText}>
              This is a demo app using Stripe test environment. You can find test card numbers in the Stripe documentation.
            </Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Your Plan</Text>
            <Text style={styles.headerSubtitle}>
              Select the plan that best fits your needs
            </Text>
            
            {/* Billing Toggle */}
            <View style={styles.billingToggle}>
              <Pressable 
                style={[styles.billingOption, !isYearly && styles.billingOptionActive]}
                onPress={() => setIsYearly(false)}
              >
                <Text style={[
                  styles.billingOptionText, 
                  !isYearly && styles.billingOptionTextActive
                ]}>
                  Monthly
                </Text>
              </Pressable>
              <Pressable 
                style={[styles.billingOption, isYearly && styles.billingOptionActive]}
                onPress={() => setIsYearly(true)}
              >
                <Text style={[
                  styles.billingOptionText, 
                  isYearly && styles.billingOptionTextActive
                ]}>
                  Yearly
                </Text>
              </Pressable>
            </View>
            
            {isYearly && proSavings.percentage > 0 && (
              <Text style={styles.savingsText}>
                Save up to {proSavings.percentage}% with yearly billing
              </Text>
            )}
          </View>

          {/* Plans */}
          <View style={styles.plansContainer}>
            {plans.map((plan, index) => {
              const IconComponent = getPlanIcon(index)
              const isRecommended = isPlanRecommended(plan)
              const isCurrent = isPlanCurrent(plan)
              const price = isYearly ? plan.prices.yearly : plan.prices.monthly

              return (
                <View 
                  key={plan.title} 
                  style={[
                    styles.planCard,
                    isRecommended && styles.planCardRecommended,
                    isCurrent && styles.planCardCurrent,
                  ]}
                >
                  {isRecommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  )}
                  
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <Check size={12} color="white" />
                      <Text style={styles.currentText}>Current</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <View style={styles.planIconContainer}>
                      <IconComponent size={24} color={colors.primaryForeground} />
                    </View>
                    <Text style={isCurrent ? styles.planTitleCurrent : styles.planTitle}>{plan.title}</Text>
                    <Text style={isCurrent ? styles.planDescriptionCurrent : styles.planDescription}>{plan.description}</Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={isCurrent ? styles.priceCurrent : styles.price}>
                      {formatPrice(price, isYearly ? 'yearly' : 'monthly')}
                    </Text>
                    {price > 0 && (
                      <>
                        <Text style={isCurrent ? styles.priceSubtextCurrent : styles.priceSubtext}>
                          per month
                        </Text>
                        {isYearly && (
                          <Text style={isCurrent ? styles.annualPriceTextCurrent : styles.annualPriceText}>
                            {getAnnualPriceText(price, 'yearly')}
                          </Text>
                        )}
                      </>
                    )}
                  </View>

                  <View style={styles.featuresContainer}>
                    <Text style={isCurrent ? styles.featuresTitleCurrent : styles.featuresTitle}>Features included:</Text>
                    <View style={styles.featuresList}>
                      {plan.benefits.map((benefit, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <Check size={16} color="#10b981" />
                          <Text style={isCurrent ? styles.featureTextCurrent : styles.featureText}>{benefit}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {plan.limitations.length > 0 && (
                    <View style={styles.limitationsContainer}>
                      <Text style={isCurrent ? styles.limitationsTitleCurrent : styles.limitationsTitle}>Limitations:</Text>
                      <View style={styles.featuresList}>
                        {plan.limitations.map((limitation, idx) => (
                          <View key={idx} style={styles.limitationItem}>
                            <X size={16} color={colors.mutedForeground} />
                            <Text style={isCurrent ? styles.limitationTextCurrent : styles.limitationText}>{limitation}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <Pressable 
                    style={[
                      styles.selectButton,
                      isCurrent && styles.selectButtonCurrent,
                      plan.prices.monthly === 0 && userPlan?.isPaid && styles.selectButtonDisabled,
                    ]}
                    onPress={() => handleSelectPlan(plan)}
                    disabled={plan.prices.monthly === 0 && userPlan?.isPaid}
                  >
                    {isCurrent ? (
                      <>
                        <Check size={16} color="white" />
                        <Text style={styles.selectButtonText}>Current Plan</Text>
                      </>
                    ) : plan.prices.monthly === 0 && userPlan?.isPaid ? (
                      <Text style={[styles.selectButtonText, styles.selectButtonTextDisabled]}>
                        Downgrade Not Available
                      </Text>
                    ) : (
                      <>
                        <ArrowRight size={16} color={colors.primaryForeground} />
                        <Text style={styles.selectButtonText}>
                          {userPlan?.isPaid ? 'Change Plan' : 'Get Started'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  )
} 