/**
 * Constants for the admin dashboard
 */

export const DATE_RANGES = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last year",
  all: "All time",
} as const;

export const USER_ROLES = ["USER", "ADMIN"] as const;

export const USER_STATUSES = ["active", "banned"] as const;

export const DOCUMENT_TYPES = ["quote", "invoice"] as const;

export const DOCUMENT_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "declined",
  "paid",
  "overdue",
] as const;

export const QR_CODE_TYPES = ["url", "pdf", "text", "whatsapp", "maps"] as const;

export const SUBSCRIPTION_PLANS = ["free", "pro", "enterprise"] as const;

export const SUBSCRIPTION_STATUSES = [
  "active",
  "canceled",
  "past_due",
  "trialing",
] as const;

export const BOOKING_STATUSES = ["scheduled", "canceled"] as const;

export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 25;

export const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
] as const;
