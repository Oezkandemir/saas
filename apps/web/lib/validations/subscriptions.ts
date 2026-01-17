import { z } from "zod";

/**
 * Zod validation schemas for subscription-related data
 */

/**
 * Subscription plan ID validation
 * Validates UUID format for Polar plan IDs
 */
export const polarPlanIdSchema = z.string().uuid().optional().nullable();

/**
 * Stripe price ID validation
 * Validates Stripe price ID format (starts with 'price_')
 */
export const stripePriceIdSchema = z
  .string()
  .regex(/^price_[a-zA-Z0-9]{24,}$/, "Invalid Stripe price ID format")
  .optional()
  .nullable();

/**
 * Subscription plan prices schema
 */
export const subscriptionPricesSchema = z.object({
  monthly: z.number().min(0),
  yearly: z.number().min(0),
});

/**
 * Subscription plan IDs schema
 */
export const subscriptionIdsSchema = z.object({
  stripeIds: z.object({
    monthly: stripePriceIdSchema,
    yearly: stripePriceIdSchema,
  }),
  polarIds: z.object({
    monthly: polarPlanIdSchema,
    yearly: polarPlanIdSchema,
  }),
});

/**
 * Subscription plan benefits/limitations schema
 */
export const planFeaturesSchema = z.object({
  benefits: z.array(z.string().min(1)).default([]),
  limitations: z.array(z.string().min(1)).default([]),
});

/**
 * Complete subscription plan schema
 */
export const subscriptionPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  benefits: z.array(z.string().min(1)),
  limitations: z.array(z.string().min(1)),
  prices: subscriptionPricesSchema,
  stripeIds: z.object({
    monthly: stripePriceIdSchema,
    yearly: stripePriceIdSchema,
  }),
  polarIds: z.object({
    monthly: polarPlanIdSchema,
    yearly: polarPlanIdSchema,
  }),
});

/**
 * Array of subscription plans schema
 */
export const subscriptionPlansArraySchema = z.array(subscriptionPlanSchema);

/**
 * Plan comparison row schema
 */
export const planComparisonRowSchema = z.object({
  feature: z.string().min(1),
  free: z.union([z.string(), z.boolean()]),
  pro: z.union([z.string(), z.boolean()]),
  enterprise: z.union([z.string(), z.boolean()]),
  tooltip: z.string().optional(),
});

/**
 * Array of plan comparison rows schema
 */
export const planComparisonSchema = z.array(planComparisonRowSchema);

/**
 * Type exports inferred from schemas
 */
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
export type SubscriptionPlansArrayInput = z.infer<
  typeof subscriptionPlansArraySchema
>;
export type PlanComparisonRowInput = z.infer<typeof planComparisonRowSchema>;
export type PlanComparisonInput = z.infer<typeof planComparisonSchema>;
