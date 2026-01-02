"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { Button } from '@/components/alignui/actions/button';
import { Badge } from '@/components/alignui/data-display/badge';
import { CreditCard, Edit, CheckCircle, XCircle } from "lucide-react";
import type { Plan } from "@/actions/admin-plan-actions";

interface PlansOverviewProps {
  plans: Plan[];
  locale: string;
}

export function PlansOverview({ plans, locale }: PlansOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.id} hover className="relative">
          {plan.is_featured && (
            <div className="absolute top-2 right-2">
              <Badge variant="default" className="text-xs">
                Featured
              </Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <CardTitle className="flex gap-2 items-center text-sm">
              <CreditCard className="size-4 text-primary" />
              {plan.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {plan.description || "No description"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Monthly:</span>
                <span className="font-semibold">
                  €{Number(plan.price_monthly).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Yearly:</span>
                <span className="font-semibold">
                  €{Number(plan.price_yearly).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t">
                <span className="text-muted-foreground">Status:</span>
                {plan.is_active ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="size-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="size-3" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
            <Link href={`/${locale}/admin/plans/${plan.id}`}>
              <Button size="sm" className="gap-2 w-full">
                <Edit className="size-3.5" />
                Edit Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}





