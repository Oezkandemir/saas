import { redirect } from "next/navigation";
import { openPolarPortal } from "@/actions/open-polar-portal";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";

/**
 * Manage Subscription Page
 * Redirects to Polar Customer Portal for subscription management
 */
export default async function ManageSubscriptionPage() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    redirect("/login");
  }

  // Get user's subscription plan
  const userSubscriptionPlan = await getUserSubscriptionPlan(user.id);

  // If user has Polar subscription, redirect to Polar portal
  if (userSubscriptionPlan.isPaid && userSubscriptionPlan.polarCustomerId) {
    try {
      await openPolarPortal(userSubscriptionPlan.polarCustomerId);
      // openPolarPortal will redirect, so this won't execute
      return null;
    } catch (_error) {
      // If portal generation fails, redirect to billing page
      redirect("/dashboard/billing");
    }
  }

  // If no Polar subscription, redirect to billing page
  redirect("/dashboard/billing");
}
