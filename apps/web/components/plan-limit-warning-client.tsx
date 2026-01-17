"use client";

/**
 * Client component wrapper for PlanLimitWarning.
 * This component can be used when PlanLimitWarning needs to be rendered
 * in a client component context.
 */
export function PlanLimitWarningClient({
  userId: _userId,
  limitType: _limitType,
  className: _className,
}: {
  userId: string;
  limitType: "customers" | "qr_codes" | "documents";
  className?: string;
}) {
  // Note: This is a client wrapper, but the actual PlanLimitWarning
  // is a server component. In most cases, you should use PlanLimitWarning
  // directly in server components.
  // This file exists to satisfy Tailwind's content scanner.
  return null;
}
