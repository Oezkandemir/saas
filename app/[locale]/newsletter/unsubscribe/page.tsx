"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { unsubscribeFromNewsletter } from "@/actions/newsletter";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";

export default function NewsletterUnsubscribe() {
  const t = useTranslations("Newsletter");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleUnsubscribe = async () => {
      try {
        const email = searchParams.get("email");
        const token = searchParams.get("token");

        console.log("Unsubscribe attempt for:", email, "with token:", token);
        setDebugInfo(`Attempting to unsubscribe: ${email}`);

        if (!email || !token) {
          setError("Invalid unsubscribe link. Missing required parameters.");
          setIsLoading(false);
          return;
        }

        // Normalize the email by trimming and converting to lowercase
        const normalizedEmail = email.trim().toLowerCase();
        console.log("Normalized email:", normalizedEmail);

        const result = await unsubscribeFromNewsletter(normalizedEmail, token);

        if (result.success) {
          setIsSuccess(true);
          toast.success(t("unsubscribeSuccess"), {
            description: result.message,
          });

          // Start countdown for redirect
          let seconds = 3;
          setCountdown(seconds);

          const countdownInterval = setInterval(() => {
            seconds -= 1;
            setCountdown(seconds);

            if (seconds <= 0) {
              clearInterval(countdownInterval);
              router.push("/");
            }
          }, 1000);

          // Clean up interval if component unmounts
          return () => clearInterval(countdownInterval);
        } else {
          console.error("Unsubscribe failed:", result.message);
          setError(result.message);
          toast.error(t("unsubscribeError"), {
            description: result.message,
          });
        }
      } catch (error) {
        console.error("Error unsubscribing:", error);
        setError(t("unsubscribeErrorDescription"));
        toast.error(t("unsubscribeError"), {
          description: t("unsubscribeErrorDescription"),
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleUnsubscribe();
  }, [searchParams, t, router]);

  return (
    <div className="container flex max-w-3xl flex-1 flex-col items-center justify-center py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>{t("unsubscribeTitle")}</CardTitle>
          <CardDescription>
            {isLoading
              ? t("unsubscribeProcessing")
              : isSuccess
                ? t("unsubscribeSuccessDescription")
                : t("unsubscribeErrorDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 pt-4">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <Icons.spinner className="size-12 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {t("unsubscribeProcessing")}
              </p>
              {debugInfo && (
                <p className="text-xs text-muted-foreground">{debugInfo}</p>
              )}
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center space-y-4">
              <Icons.check className="size-12 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                {t("unsubscribeSuccessDescription")}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to homepage in {countdown} seconds...
              </p>
              <Link href="/">
                <Button className="mt-4">Go to Homepage</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <Icons.warning className="size-12 text-red-500" />
              <p className="text-center text-sm text-muted-foreground">
                {error || t("unsubscribeErrorDescription")}
              </p>
              {debugInfo && (
                <p className="text-xs text-muted-foreground">{debugInfo}</p>
              )}
              <Link href="/support">
                <Button className="mt-4">{t("contactSupportButton")}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
