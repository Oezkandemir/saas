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
          <div className={`p-3 rounded-md my-4 ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <p className="font-medium">{result.message}</p>
            {result.details && (
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleConfigure}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 size-4 animate-spin" /> Configuring...
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