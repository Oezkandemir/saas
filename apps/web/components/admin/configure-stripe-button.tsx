"use client";

import React, { useState } from "react";
import { configureStripePortal } from "@/actions/configure-stripe-portal";
import { toast } from "sonner";

import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { Icons } from "@/components/shared/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { logger } from "@/lib/logger";

export function ConfigureStripePortalButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stripeApiKey, setStripeApiKey] = useState<string | null>(null);

  const handleConfigure = async () => {
    setIsLoading(true);
    try {
      const result = await configureStripePortal();
      setResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      logger.error("Error configuring Stripe portal:", error);
      toast.error("An error occurred while configuring the Stripe portal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Portal Configuration</CardTitle>
        <CardDescription>
          Configure the Stripe Customer Portal for subscription management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Click the button below to configure the Stripe Customer Portal with
          the recommended settings for subscription management. This will allow
          users to manage their subscriptions, update payment methods, and view
          billing history.
        </p>

        {result && (
          <div
            className={`my-4 rounded-md border p-3 ${result.success ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            <p className="font-medium">{result.message}</p>
            {result.details && (
              <pre className="mt-2 overflow-auto text-xs">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        <p className="mb-4 text-sm text-muted-foreground">
          Go to Stripe dashboard, and then &quot;Configure branding&quot; and
          &quot;Configure email&quot; on this link
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Paste the Stripe API key from Stripe Dashboard -&gt; API keys -&gt;
          Secret key
        </p>
        <div
          className={`my-4 rounded-md border p-3 ${
            stripeApiKey ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <p className="text-sm">
            {stripeApiKey
              ? "Stripe API key is configured"
              : "Stripe API key is not configured"}
          </p>
          <pre className="mt-2 overflow-auto text-xs">{stripeApiKey || ""}</pre>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleConfigure} disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" variant="primary" />
              <span>Configuring...</span>
            </>
          ) : (
            <>
              <Icons.settings className="mr-2 size-4" /> Configure Stripe Portal
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
