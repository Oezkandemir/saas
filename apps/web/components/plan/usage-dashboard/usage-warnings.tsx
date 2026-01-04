"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from '@/components/alignui/actions/button';
import Link from "next/link";

interface UsageWarning {
  limitType: string;
  current: number;
  limit: number;
  percentage: number;
}

interface UsageWarningsProps {
  warnings: UsageWarning[];
  locale?: string;
}

export function UsageWarnings({ warnings, locale = "en" }: UsageWarningsProps) {
  const getLimitTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      customers: "Customers",
      qr_codes: "QR Codes",
      documents: "Documents",
      api_calls: "API Calls",
      email_sends: "Email Sends",
      storage: "Storage",
      team_members: "Team Members",
    };
    return labels[type] || type;
  };

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Usage Warnings</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>You are approaching your plan limits:</p>
        <ul className="list-disc list-inside space-y-1">
          {warnings.map((warning) => (
            <li key={warning.limitType}>
              <strong>{getLimitTypeLabel(warning.limitType)}</strong>: {warning.current} / {warning.limit} ({warning.percentage}%)
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Link href={`/${locale}/settings/billing`}>
            <Button variant="outline" size="sm">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}











