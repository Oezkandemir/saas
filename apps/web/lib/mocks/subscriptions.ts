/**
 * MOCK DATA - Development/Testing Only
 * 
 * This file contains hardcoded mock values for development and testing purposes.
 * These values should NEVER be used in production.
 * 
 * In production, use environment variables from env.mjs
 */

export const mockPolarIds = {
  pro: {
    monthly: "77c6e131-56bc-46cf-8c5b-d8e6814a356b", // Sandbox Pro Monthly
    yearly: "8bc98233-3a2c-46e5-ae90-c71ac7b4e22f", // Sandbox Pro Yearly
  },
  enterprise: {
    monthly: "2a37d4e2-e513-4c3b-b463-9c79372a0e4f", // Sandbox Enterprise Monthly
    yearly: "d05fc952-3c93-43cf-a8ac-9c2fea507e6c", // Sandbox Enterprise Yearly
  },
} as const;

/**
 * Mock subscription plans for testing
 */
export const mockSubscriptionPlans = {
  free: {
    title: "Free",
    description: "Für den Einstieg",
    price: 0,
  },
  pro: {
    title: "Pro",
    description: "Für professionelle Nutzer",
    price: 10,
  },
  enterprise: {
    title: "Enterprise",
    description: "Für große Unternehmen",
    price: 20,
  },
} as const;
