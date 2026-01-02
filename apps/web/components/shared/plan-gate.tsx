"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from '@/components/alignui/actions/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlanGateProps {
  children: ReactNode;
  requiredPlan: "starter" | "pro";
  currentPlan?: string;
  className?: string;
}

export function PlanGate({
  children,
  requiredPlan,
  currentPlan = "free",
  className,
}: PlanGateProps) {
  const planHierarchy = { free: 0, starter: 1, pro: 2 };
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
            className={cn(
              "relative cursor-not-allowed opacity-60",
              className,
            )}
          >
            {children}
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex flex-col gap-2">
            <p className="font-medium">
              Verfügbar in {requiredPlan === "pro" ? "Pro" : "Starter"}
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






