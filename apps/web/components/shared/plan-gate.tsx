"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PlanGateProps {
  children: ReactNode;
  requiredPlan: "pro" | "enterprise";
  currentPlan?: string;
  className?: string;
}

export function PlanGate({
  children,
  requiredPlan,
  currentPlan = "free",
  className,
}: PlanGateProps) {
  const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
  const hasAccess =
    planHierarchy[currentPlan.toLowerCase() as keyof typeof planHierarchy] >=
    planHierarchy[requiredPlan];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn("relative cursor-not-allowed opacity-60", className)}
          >
            {children}
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Lock className="size-6 text-muted-foreground" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex flex-col gap-2">
            <p className="font-medium">
              Verfügbar in {requiredPlan === "pro" ? "Pro" : "Enterprise"}
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/billing">Upgrade</Link>
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
