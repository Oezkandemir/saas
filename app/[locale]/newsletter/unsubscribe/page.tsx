"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUnsubscribe = async () => {
      try {
        const email = searchParams.get("email");
        const token = searchParams.get("token");

        if (!email || !token) {
          setError("Invalid unsubscribe link. Missing required parameters.");
          setIsLoading(false);
          return;
        }

        const result = await unsubscribeFromNewsletter(email, token);

        if (result.success) {
          setIsSuccess(true);
          toast.success(t("unsubscribeSuccess"), {
            description: result.message,
          });
        } else {
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
  }, [searchParams, t]);

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
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center space-y-4">
              <Icons.check className="size-12 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                {t("unsubscribeSuccessDescription")}
              </p>
              <Link href="/newsletter">
                <Button className="mt-4">{t("resubscribeButton")}</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <Icons.warning className="size-12 text-red-500" />
              <p className="text-center text-sm text-muted-foreground">
                {error || t("unsubscribeErrorDescription")}
              </p>
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
