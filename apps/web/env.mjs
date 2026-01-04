import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Authentication - made optional since we're using Supabase auth
    AUTH_SECRET: z.string().optional().default(""),
    
    // Email
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    
    // PDF Service (optional - wird für Rechnungen/Angebote benötigt)
    PDF_SERVICE_URL: z.string().url().optional(),
    PDF_SERVICE_API_KEY: z.string().optional(),
    
    // Stripe
    STRIPE_API_KEY: z.string().optional().default(""),
    STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
    
    // Polar.sh
    POLAR_ACCESS_TOKEN: z.string().optional().default(""),
    // Use sandbox environment for testing (default: false for production)
    POLAR_USE_SANDBOX: z.string().optional().default("false"),
    
    // Supabase config
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_JWT_SECRET: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    
    // Stripe
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID: z.string().optional().default(""),
    NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID: z.string().optional().default(""),
    NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID: z.string().optional().default(""),
    NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID: z.string().optional().default(""),
    
    // Polar.sh
    POLAR_SUCCESS_URL: z.string().url().optional(),
    // Payment provider selection: "stripe" | "polar" | "both" (default: "stripe")
    NEXT_PUBLIC_PAYMENT_PROVIDER: z.enum(["stripe", "polar", "both"]).optional().default("stripe"),
    
    // Supabase config
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    // Authentication
    AUTH_SECRET: process.env.AUTH_SECRET,
    
    // Email
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    
    // PDF Service
    PDF_SERVICE_URL: process.env.PDF_SERVICE_URL,
    PDF_SERVICE_API_KEY: process.env.PDF_SERVICE_API_KEY,
    
    // Stripe
    STRIPE_API_KEY: process.env.STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID,
    NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID,
    NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID,
    NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID:
      process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID,
    
    // Polar.sh
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_SUCCESS_URL: process.env.POLAR_SUCCESS_URL,
    POLAR_USE_SANDBOX: process.env.POLAR_USE_SANDBOX || "false",
    NEXT_PUBLIC_PAYMENT_PROVIDER: process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "stripe",
    
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  },
});
