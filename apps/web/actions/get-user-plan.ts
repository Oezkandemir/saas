"use server";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { UserSubscriptionPlan } from "@/types";

export async function getUserPlan(): Promise<UserSubscriptionPlan | null> {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return null;
    }

    const subscriptionPlan = await getUserSubscriptionPlan(user.id, user.email);
    return subscriptionPlan;
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return null;
  }
}



