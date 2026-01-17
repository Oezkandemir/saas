import { z } from "zod";

// User validations
export const userRoleSchema = z.enum(["USER", "ADMIN"]);

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});

// Plan validations
export const planSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().default("USD"),
  interval: z.enum(["month", "year"]),
  features: z.array(z.string()).default([]),
  limits: z.record(z.string(), z.number()).default({}),
  is_active: z.boolean().default(true),
});

// Role validations
export const roleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  permissions: z.record(z.string(), z.boolean()),
  is_system_role: z.boolean().default(false),
});

// Webhook validations
export const webhookSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  url: z.string().url("Invalid URL"),
  events: z.array(z.string()).min(1, "At least one event is required"),
  secret: z.string().min(16, "Secret must be at least 16 characters"),
  is_active: z.boolean().default(true),
});

// Blog post validations
export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  content: z.string().min(1, "Content is required"),
  image: z.string().url("Invalid image URL"),
  authors: z.array(z.string()).min(1, "At least one author is required"),
  categories: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

// Support ticket message validations
export const ticketMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

// Company profile validations (if needed)
export const companyProfileSchema = z.object({
  profile_name: z.string().min(1, "Profile name is required"),
  company_name: z.string().min(1, "Company name is required"),
  company_email: z.string().email("Invalid email"),
  company_country: z.string().min(1, "Country is required"),
  // Add other fields as needed
});
