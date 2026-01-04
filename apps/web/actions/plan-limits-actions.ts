"use server";

import { checkPlanLimit, LimitType } from "@/lib/plan-limits";
import { getCurrentUser } from "@/lib/session";

export async function getPlanLimitInfo(limitType: LimitType) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return await checkPlanLimit(user.id, limitType);
}
















