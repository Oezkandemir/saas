"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  cancelSubscription, 
  reactivateSubscription,
  updateSubscriptionPlan,
} from "@/actions/manage-polar-subscription";
import { refreshSubscription } from "@/actions/refresh-subscription";
import { UserSubscriptionPlan } from "types";
import { cn, formatDate } from "@/lib/utils";
import { Button } from '@/components/alignui/actions/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Icons } from "@/components/shared/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, Calendar, CreditCard, AlertTriangle } from "lucide-react";
import { pricingData } from "@/config/subscriptions";
import { logger } from "@/lib/logger";

interface ManageSubscriptionClientProps {
  userSubscriptionPlan: UserSubscriptionPlan;
}

export function ManageSubscriptionClient({ 
  userSubscriptionPlan 
}: ManageSubscriptionClientProps) {
  const router = useRouter();
  const t = useTranslations("Billing");
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  const {
    title,
    description,
    polarProductId,
    polarSubscriptionId,
    isPaid,
    isCanceled,
    polarCurrentPeriodEnd,
    polarCurrentPeriodStart,
    interval,
  } = userSubscriptionPlan;

  const currentPeriodEnd = polarCurrentPeriodEnd || 0;
  const currentPeriodStart = polarCurrentPeriodStart || null;

  // Get available plans for upgrade/downgrade
  const availablePlans = pricingData.filter(plan => plan.title !== title);
  const currentPlan = pricingData.find(plan => plan.title === title);

  const handleCancel = async (cancelAtPeriodEnd: boolean) => {
    setIsLoading(true);
    try {
      const result = await cancelSubscription(cancelAtPeriodEnd);
      
      if (result.success) {
        toast.success("Subscription canceled", {
          description: result.message,
        });
        setShowCancelDialog(false);
        router.refresh();
      } else {
        toast.error("Failed to cancel subscription", {
          description: result.message,
        });
      }
    } catch (error) {
      logger.error("Error canceling subscription:", error);
      toast.error("An error occurred while canceling subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsLoading(true);
    try {
      const result = await reactivateSubscription();
      
      if (result.success) {
        toast.success("Subscription reactivated", {
          description: result.message,
        });
        setShowReactivateDialog(false);
        router.refresh();
      } else {
        toast.error("Failed to reactivate subscription", {
          description: result.message,
        });
      }
    } catch (error) {
      logger.error("Error reactivating subscription:", error);
      toast.error("An error occurred while reactivating subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = async (newProductId: string) => {
    setIsLoading(true);
    try {
      // If no subscription ID, try to sync first
      if (!polarSubscriptionId && polarProductId) {
        toast.info("Syncing subscription data...", {
          description: "Please wait while we fetch your subscription information.",
        });
        
        // Try to refresh subscription data
        const refreshResult = await refreshSubscription();
        
        if (!refreshResult.success) {
          toast.error("Failed to sync subscription", {
            description: refreshResult.message || "Please try refreshing the page or contact support.",
          });
          setIsLoading(false);
          return;
        }
        
        toast.success("Subscription synced", {
          description: "Your subscription data has been updated.",
        });
        
        // Refresh the page to get updated subscription data
        router.refresh();
        setIsLoading(false);
        return;
      }

      if (!polarSubscriptionId) {
        toast.error("No active subscription found", {
          description: "Please refresh the page or contact support if this issue persists.",
        });
        setIsLoading(false);
        return;
      }

      const result = await updateSubscriptionPlan(newProductId);
      
      if (result.success) {
        toast.success("Plan updated successfully", {
          description: result.message,
        });
        router.refresh();
        // Redirect to billing page after a short delay
        setTimeout(() => {
          router.push("/dashboard/billing");
        }, 1500);
      } else {
        toast.error("Failed to update plan", {
          description: result.message,
        });
      }
    } catch (error) {
      logger.error("Error updating plan:", error);
      toast.error("An error occurred while updating plan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{title} Plan</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <Badge 
              variant={isCanceled ? "outline" : "default"} 
              className={cn(
                "text-sm px-3 py-1",
                isCanceled 
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
              )}
            >
              {isCanceled ? (
                <div className="flex items-center gap-1.5">
                  <XCircle className="size-3.5" />
                  <span>Canceled</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span>Active</span>
                </div>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CreditCard className="size-4" />
                <span>Billing Cycle</span>
              </div>
              <p className="text-lg font-semibold">
                {interval === "month" ? "Monthly" : "Yearly"}
              </p>
            </div>

            {currentPeriodStart && (
              <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="size-4" />
                  <span>Current Period</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDate(currentPeriodStart)} - {formatDate(currentPeriodEnd)}
                </p>
              </div>
            )}

            {currentPeriodEnd > 0 && (
              <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="size-4" />
                  <span>{isCanceled ? "Ends On" : "Renews On"}</span>
                </div>
                <p className="text-lg font-semibold">
                  {formatDate(currentPeriodEnd)}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            {isCanceled ? (
              <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" variant="primary" />
                        <span>Reactivating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" />
                        Reactivate Subscription
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Reactivate Subscription</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Are you sure you want to reactivate your subscription? 
                      Your subscription will continue and you will be charged on {formatDate(currentPeriodEnd)}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                    <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleReactivate}
                      className="w-full sm:w-auto"
                    >
                      Reactivate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" variant="primary" />
                        <span>Canceling...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 size-4" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Cancel Subscription</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Are you sure you want to cancel your subscription? 
                      You can choose to cancel immediately or at the end of your billing period.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                    <AlertDialogCancel className="w-full sm:w-auto">Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancel(true)}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Cancel at Period End
                    </AlertDialogAction>
                    <AlertDialogAction
                      onClick={() => handleCancel(false)}
                      className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white"
                    >
                      Cancel Immediately
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Change Plan Section */}
            {!isCanceled && (
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Change Plan</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {availablePlans.map((plan) => {
                    const planProductId = interval === "month" 
                      ? plan.polarIds?.monthly 
                      : plan.polarIds?.yearly;
                    
                    if (!planProductId) return null;

                    const isUpgrade = plan.title === "Enterprise" || 
                      (plan.title === "Pro" && title === "Free");

                    return (
                      <Card key={plan.title} className="relative">
                        <CardHeader>
                          <CardTitle className="text-lg">{plan.title}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold">
                                €{interval === "month" ? plan.prices.monthly : plan.prices.yearly}
                                <span className="text-sm font-normal text-muted-foreground">
                                  /{interval === "month" ? "month" : "year"}
                                </span>
                              </p>
                            </div>
                            <Button
                              variant={isUpgrade ? "primary" : "outline"}
                              size="sm"
                              onClick={() => handlePlanChange(planProductId)}
                              disabled={isLoading}
                            >
                              {isUpgrade ? "Upgrade" : "Downgrade"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

