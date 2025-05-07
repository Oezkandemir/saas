"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { useSupabase } from "@/components/supabase-provider";

export default function VerifiedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [countdown, setCountdown] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const { supabase } = useSupabase();

  // Try to sign in the user automatically
  const autoSignIn = async (email: string) => {
    try {
      setIsLoading(true);

      // First, try to get user's email
      const { data, error } = await fetch(
        `/api/get-user-email?userId=${userId}`,
      ).then((res) => res.json());

      if (error || !data?.email) {
        console.error("Error getting user email:", error);
        toast.error(
          "Konnte Ihre E-Mail-Adresse nicht abrufen. Bitte melden Sie sich manuell an.",
        );
        return;
      }

      // Send magic link
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (magicLinkError) {
        console.error("Error sending magic link:", magicLinkError);
        toast.error(
          "Konnte keinen Anmeldelink senden. Bitte melden Sie sich manuell an.",
        );
        return;
      }

      toast.success(
        "Ein Anmeldelink wurde an Ihre E-Mail-Adresse gesendet. Bitte prüfen Sie Ihren Posteingang.",
      );
    } catch (error) {
      console.error("Error during auto sign-in:", error);
      toast.error(
        "Ein Fehler ist aufgetreten. Bitte melden Sie sich manuell an.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If userId is provided, try to send a magic link
    if (userId) {
      autoSignIn(userId);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/auth/signin");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, userId]);

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.check className="mx-auto size-12 text-green-500" />
          <h1 className="text-2xl font-semibold tracking-tight">
            E-Mail verifiziert!
          </h1>
          <p className="text-sm text-muted-foreground">
            Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Danke für die
            Registrierung bei {siteConfig.name}.
          </p>
          <p className="text-sm font-medium text-primary">
            Sie werden in {countdown} Sekunden zur Anmeldeseite
            weitergeleitet...
          </p>
        </div>

        <div className="grid gap-2">
          <Button
            className={buttonVariants({ variant: "default" })}
            onClick={() => router.push("/auth/signin")}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 size-4 animate-spin" />
                Wird geladen...
              </>
            ) : (
              "Jetzt anmelden"
            )}
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
