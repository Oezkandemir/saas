"use client";

import React, { useState } from "react";
import { configureStripePortal } from "@/actions/configure-stripe-portal";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      console.error("Error configuring Stripe portal:", error);
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
        <p className="text-sm text-muted-foreground mb-4">
          Click the button below to configure the Stripe Customer Portal with the
          recommended settings for subscription management. This will allow users
          to manage their subscriptions, update payment methods, and view billing
          history.
        </p>
        
        {result && (
          <div className={`border rounded-md p-3 my-4 ${result.success ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            <p className="font-medium">{result.message}</p>
            {result.details && (
              <pre className="text-xs overflow-auto mt-2">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          Go to Stripe dashboard, and then "Configure branding" and "Configure
          email" on this link
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Paste the Stripe API key from Stripe Dashboard -&gt; API keys -&gt;
          Secret key
        </p>
        <div
          className={`border rounded-md p-3 my-4 ${
            stripeApiKey ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <p className="text-sm">
            {stripeApiKey
              ? "Stripe API key is configured"
              : "Stripe API key is not configured"}
          </p>
          <pre className="text-xs overflow-auto mt-2">{stripeApiKey || ""}</pre>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleConfigure}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Icons.spinner className="size-4 mr-2 animate-spin" /> Configuring...
            </>
          ) : (
            <>
              <Icons.settings className="size-4 mr-2" /> Configure Stripe Portal
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 