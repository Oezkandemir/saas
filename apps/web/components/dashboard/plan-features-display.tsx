"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanFeaturesInfo } from "@/lib/plan-features";

interface PlanFeaturesDisplayProps {
  planInfo: PlanFeaturesInfo;
}

export function PlanFeaturesDisplay({ planInfo }: PlanFeaturesDisplayProps) {
  const { planTitle, isPaid, features } = planInfo;

  const getLimitDisplay = (limit: PlanFeaturesInfo["features"][0]["limit"]) => {
    if (!limit) return null;

    const { current, max } = limit;
    const isUnlimited = max === "unlimited";
    const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
    const isNearLimit = !isUnlimited && percentage >= 80;
    const isAtLimit = !isUnlimited && current >= max;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {current} / {isUnlimited ? "∞" : max}
          </span>
          {isUnlimited && (
            <Badge variant="secondary" className="text-xs">
              Unbegrenzt
            </Badge>
          )}
        </div>
        {!isUnlimited && (
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full transition-all",
                isAtLimit && "bg-destructive",
                isNearLimit && !isAtLimit && "bg-yellow-500",
                !isAtLimit && !isNearLimit && "bg-primary",
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
        {isAtLimit && (
          <p className="text-xs text-destructive">
            Limit erreicht. Bitte upgraden Sie auf einen Pro-Plan.
          </p>
        )}
        {isNearLimit && !isAtLimit && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Limit fast erreicht ({Math.round(percentage)}%).
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Features & Limits</CardTitle>
        <CardDescription>
          Übersicht über Ihre verfügbaren Features und aktuellen Limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Badge */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <Badge variant={isPaid ? "default" : "outline"} className="text-sm">
            {planTitle} Plan
          </Badge>
          {isPaid && (
            <span className="text-sm text-muted-foreground">
              Alle Features aktiviert
            </span>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "p-4 rounded-lg border transition-colors",
                feature.enabled
                  ? "bg-background border-border"
                  : "bg-muted/50 border-border/50 opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl shrink-0">{feature.icon}</div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{feature.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {feature.enabled ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Limit Display */}
                  {feature.limit && feature.enabled && (
                    <div className="pt-2 mt-2 border-t">
                      {getLimitDisplay(feature.limit)}
                    </div>
                  )}

                  {/* Upgrade Prompt for Disabled Features */}
                  {!feature.enabled && (
                    <div className="pt-2 mt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Verfügbar im Pro-Plan
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade CTA for Free Plan */}
        {!isPaid && (
          <div className="pt-4 mt-4 border-t">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-1">
                Upgrade auf Pro für alle Features
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Erhalten Sie unbegrenzte Limits und alle Premium-Features
              </p>
              <a
                href="/dashboard/billing"
                className="text-xs text-primary hover:underline font-medium"
              >
                Jetzt upgraden →
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

