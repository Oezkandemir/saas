/**
 * MOCK DATA - Central Export
 * 
 * This module exports all mock data for development and testing.
 * Mocks should only be used in:
 * - Development environment (NODE_ENV === 'development')
 * - Test files (*.test.ts, *.spec.ts)
 * - Storybook stories
 * 
 * NEVER use mocks in production code paths.
 */

export * from "./subscriptions";

// Re-export for convenience
export { mockPolarIds, mockSubscriptionPlans } from "./subscriptions";
