"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { PlanFeaturesInfo } from "@/lib/plan-features";
import { CheckCircle, XCircle, Infinity as InfinityIcon } from "lucide-react";

interface UsageDashboardProps {
  planFeatures: PlanFeaturesInfo;
}

export function UsageDashboard({ planFeatures }: UsageDashboardProps) {
  const getUsagePercentage = (current: number, max: string | number): number => {
    if (max === "unlimited" || max === Infinity) return 0;
    const maxNum = typeof max === "string" ? parseInt(max) : max;
    if (maxNum === 0) return 0;
    return Math.min((current / maxNum) * 100, 100);
  };

  const formatLimit = (max: string | number): string => {
    if (max === "unlimited" || max === Infinity) return "Unlimited";
    return max.toString();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {planFeatures.features.map((feature) => (
        <Card key={feature.name} hover>
          <CardHeader className="pb-3">
            <CardTitle className="flex gap-2 items-center text-sm">
              <span className="text-lg">{feature.icon}</span>
              {feature.name}
            </CardTitle>
            <CardDescription className="text-xs">
              {feature.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {feature.limit ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-semibold">
                      {feature.limit.current} / {formatLimit(feature.limit.max)}
                    </span>
                  </div>
                  {feature.limit.max !== "unlimited" && feature.limit.max !== Infinity && (
                    <Progress
                      value={getUsagePercentage(feature.limit.current, feature.limit.max)}
                      className="h-2"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {feature.limit.max === "unlimited" || feature.limit.max === Infinity ? (
                    <>
                      <InfinityIcon className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Unlimited</span>
                    </>
                  ) : (
                    <>
                      {feature.limit.current < feature.limit.max ? (
                        <>
                          <CheckCircle className="size-3 text-green-500" />
                          <span className="text-muted-foreground">
                            {feature.limit.max - feature.limit.current} remaining
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3 text-red-500" />
                          <span className="text-red-500">Limit reached</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {feature.enabled ? (
                  <>
                    <CheckCircle className="size-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Enabled</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Not available</span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

