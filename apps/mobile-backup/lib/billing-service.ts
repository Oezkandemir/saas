import { supabase } from './supabase'

// Subscription plans configuration matching the web app
export interface SubscriptionPlan {
  title: string
  description: string
  benefits: string[]
  limitations: string[]
  prices: {
    monthly: number
    yearly: number
  }
  stripeIds: {
    monthly: string | null
    yearly: string | null
  }
  productId?: string
}

export interface UserSubscriptionPlan extends SubscriptionPlan {
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  stripeCurrentPeriodEnd: number
  isPaid: boolean
  interval: "month" | "year" | null
  isCanceled?: boolean
}

// Available subscription plans
export const pricingData: SubscriptionPlan[] = [
  {
    title: "Starter",
    description: "For Beginners",
    benefits: [
      "Up to 100 monthly posts",
      "Basic analytics and reporting",
      "Access to standard templates",
    ],
    limitations: [
      "No priority access to new features.",
      "Limited customer support",
      "No custom branding",
      "Limited access to business resources.",
    ],
    prices: {
      monthly: 0,
      yearly: 0,
    },
    stripeIds: {
      monthly: null,
      yearly: null,
    },
  },
  {
    title: "Pro",
    description: "Unlock Advanced Features",
    benefits: [
      "Up to 500 monthly posts",
      "Advanced analytics and reporting",
      "Access to business templates",
      "Priority customer support",
      "Exclusive webinars and training.",
    ],
    limitations: [
      "No custom branding",
      "Limited access to business resources.",
    ],
    prices: {
      monthly: 15,
      yearly: 144,
    },
    stripeIds: {
      monthly: "price_1RJKt5P6RFbJXLAuShEYRHmK",
      yearly: "price_1RJKpbP6RFbJXLAuxEusMlxJ",
    },
    productId: "prod_SDmREGQQyYpwT4",
  },
  {
    title: "Business",
    description: "For Power Users",
    benefits: [
      "Unlimited posts",
      "Real-time analytics and reporting",
      "Access to all templates, including custom branding",
      "24/7 business customer support",
      "Personalized onboarding and account management.",
    ],
    limitations: [],
    prices: {
      monthly: 30,
      yearly: 300,
    },
    stripeIds: {
      monthly: "price_1RJKttP6RFbJXLAud1GJmfMC",
      yearly: "price_1RJKvFP6RFbJXLAutOjKOsMJ",
    },
    productId: "prod_SDmSl1ZZmn7xQG",
  },
]

// Default free subscription plan as a fallback
const DEFAULT_FREE_PLAN: UserSubscriptionPlan = {
  ...pricingData[0],
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: 0,
  isPaid: false,
  interval: null,
  isCanceled: false
}

/**
 * Get user's current subscription plan
 * 
 * @param userId - User ID
 * @returns Promise with user subscription plan or error
 */
export async function getUserSubscriptionPlan(userId: string): Promise<{ success: boolean; data?: UserSubscriptionPlan; error?: string }> {
  try {
    if (!userId) {
      console.warn("getUserSubscriptionPlan called without userId")
      return { success: true, data: DEFAULT_FREE_PLAN }
    }

    // Fetch user's subscription data from the database
    const { data: userData, error } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_current_period_end')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user subscription data:', error)
      return { success: false, error: `Failed to fetch subscription data: ${error.message}` }
    }

    if (!userData) {
      console.warn(`No subscription data found for user ${userId}`)
      return { success: true, data: DEFAULT_FREE_PLAN }
    }

    // Map Supabase column names to our expected format
    const user = {
      stripeCustomerId: userData.stripe_customer_id,
      stripeSubscriptionId: userData.stripe_subscription_id,
      stripePriceId: userData.stripe_price_id,
      stripeCurrentPeriodEnd: userData.stripe_current_period_end ? new Date(userData.stripe_current_period_end) : null,
    }

    // Check if user is on a paid plan
    const isPaid = user.stripePriceId && 
      user.stripeCurrentPeriodEnd && 
      user.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()

    // Find the pricing data corresponding to the user's plan
    const userPlan = pricingData.find((plan) => 
      plan.stripeIds.monthly === user.stripePriceId || 
      plan.stripeIds.yearly === user.stripePriceId
    )

    // Use the found plan or default to free
    const plan = isPaid && userPlan ? userPlan : pricingData[0]

    // Determine the interval based on which price ID matched
    const interval = isPaid && userPlan
      ? userPlan.stripeIds.monthly === user.stripePriceId
        ? "month"
        : userPlan.stripeIds.yearly === user.stripePriceId
        ? "year"
        : null
      : null

    // Return the complete user subscription plan
    const result: UserSubscriptionPlan = {
      ...plan,
      ...user,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.getTime() || 0,
      isPaid: isPaid || false,
      interval,
      isCanceled: false // We'll set this to false for now since we can't easily check Stripe in mobile
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Exception in getUserSubscriptionPlan:', error)
    return { success: false, error: 'An unexpected error occurred while fetching subscription data' }
  }
}

/**
 * Get all available subscription plans
 * 
 * @returns Available subscription plans
 */
export function getAvailablePlans(): SubscriptionPlan[] {
  return pricingData
}

/**
 * Format price for display
 * 
 * @param price - Price in dollars
 * @param interval - Billing interval
 * @returns Formatted price string
 */
export function formatPrice(price: number, interval: 'monthly' | 'yearly'): string {
  if (price === 0) return 'Free'
  
  const currency = '$'
  
  // For yearly pricing, show the monthly equivalent (like web version)
  if (interval === 'yearly') {
    const monthlyEquivalent = Math.floor(price / 12)
    return `${currency}${monthlyEquivalent}/month`
  }
  
  return `${currency}${price}/month`
}

/**
 * Get the total annual price for display
 * 
 * @param price - Price in dollars
 * @param interval - Billing interval
 * @returns Total annual price string
 */
export function getAnnualPriceText(price: number, interval: 'monthly' | 'yearly'): string {
  if (price === 0) return ''
  
  if (interval === 'yearly') {
    return `$${price} billed annually`
  }
  
  return `$${price * 12} billed annually`
}

/**
 * Calculate yearly savings
 * 
 * @param monthlyPrice - Monthly price
 * @param yearlyPrice - Yearly price
 * @returns Savings amount and percentage
 */
export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): { amount: number; percentage: number } {
  if (monthlyPrice === 0 || yearlyPrice === 0) {
    return { amount: 0, percentage: 0 }
  }
  
  const yearlyEquivalent = monthlyPrice * 12
  const savings = yearlyEquivalent - yearlyPrice
  const percentage = Math.round((savings / yearlyEquivalent) * 100)
  
  return { amount: savings, percentage }
} 