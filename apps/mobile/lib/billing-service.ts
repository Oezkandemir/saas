import { supabase } from './supabase';

export interface SubscriptionPlan {
  title: string;
  description: string;
  benefits: string[];
  limitations: string[];
  prices: {
    monthly: number;
    yearly: number;
  };
  stripeIds: {
    monthly: string | null;
    yearly: string | null;
  };
  productId?: string;
}

export interface UserSubscriptionPlan extends SubscriptionPlan {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: number | null;
  isPaid: boolean;
  interval: "month" | "year" | null;
  isCanceled: boolean;
}

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
];

// Default free subscription plan as a fallback
const DEFAULT_FREE_PLAN: UserSubscriptionPlan = {
  ...pricingData[0],
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: 0,
  isPaid: false,
  interval: null,
  isCanceled: false,
};

export async function getUserSubscriptionPlan(
  userId: string,
  userEmail?: string,
): Promise<UserSubscriptionPlan> {
  // If no userId provided, return the default free plan
  if (!userId) {
    console.warn("getUserSubscriptionPlan called without userId");
    return DEFAULT_FREE_PLAN;
  }

  try {
    // Fetch user with Supabase by ID
    let userData = null;
    let error = null;

    // Try to find by user ID first
    const userResult = await supabase
      .from("users")
      .select(
        "id, email, stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_current_period_end",
      )
      .eq("id", userId)
      .single();

    userData = userResult.data;
    error = userResult.error;

    console.log(`Fetching subscription data for user ${userId}`);
    console.log(`Database record:`, userData);

    // If user not found by ID and we have an email, try to find by email
    if ((!userData || error) && userEmail) {
      console.log(
        `User not found by ID ${userId}, trying with email ${userEmail}`,
      );
      const emailResult = await supabase
        .from("users")
        .select(
          "id, email, stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_current_period_end",
        )
        .eq("email", userEmail)
        .single();

      if (emailResult.data && !emailResult.error) {
        console.log(
          `Found user by email ${userEmail} with ID ${emailResult.data.id}`,
        );
        userData = emailResult.data;
        error = null;
      }
    }

    // If user not found, return the default free plan instead of throwing an error
    if (error || !userData) {
      console.warn(
        `User with id ${userId} not found in Supabase database:`,
        error?.message || "No data returned",
      );
      return DEFAULT_FREE_PLAN;
    }

    // Map Supabase column names to our expected format
    const user = {
      stripeCustomerId: userData.stripe_customer_id,
      stripeSubscriptionId: userData.stripe_subscription_id,
      stripePriceId: userData.stripe_price_id,
      stripeCurrentPeriodEnd: userData.stripe_current_period_end
        ? new Date(userData.stripe_current_period_end)
        : null,
    };

    console.log("User stripe data:", {
      customerId: user.stripeCustomerId,
      subscriptionId: user.stripeSubscriptionId,
      priceId: user.stripePriceId,
      periodEnd: user.stripeCurrentPeriodEnd,
    });

    // Check if user is on a paid plan.
    const isPaid =
      user.stripePriceId &&
      user.stripeCurrentPeriodEnd?.getTime() + 86_400_000 > Date.now()
        ? true
        : false;

    // Find the pricing data corresponding to the user's plan
    // First check monthly prices, then yearly prices
    const userPlan =
      pricingData.find(
        (plan) => plan.stripeIds.monthly === user.stripePriceId,
      ) ||
      pricingData.find((plan) => plan.stripeIds.yearly === user.stripePriceId);

    console.log("Matched plan:", userPlan?.title || "No matching plan found");

    // Use the found plan or default to free
    const plan = isPaid && userPlan ? userPlan : pricingData[0];

    // Determine the interval based on which price ID matched
    const interval: "month" | "year" | null = isPaid
      ? userPlan?.stripeIds.monthly === user.stripePriceId
        ? "month"
        : userPlan?.stripeIds.yearly === user.stripePriceId
          ? "year"
          : null
      : null;

    // Check if subscription is set to cancel at period end
    let isCanceled = false;
    // Note: In mobile we can't directly access Stripe, so we'd need an API endpoint for this
    // For now, we'll assume it's not canceled unless we have that data

    // Return the complete user subscription plan
    const result = {
      ...plan,
      ...user,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.getTime() || 0,
      isPaid,
      interval,
      isCanceled,
    };

    console.log("Returning subscription plan:", {
      title: result.title,
      isPaid: result.isPaid,
      priceId: result.stripePriceId,
      interval: result.interval,
    });

    return result;
  } catch (error) {
    console.error("Unexpected error in getUserSubscriptionPlan:", error);
    // Return default plan in case of any error
    return DEFAULT_FREE_PLAN;
  }
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
} 