"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { siteConfig } from "@/config/site";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

export default function VerifiedPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      router.push(`/${locale}/login`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [router, locale, countdown]);

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.check className="mx-auto size-12 text-green-500" />
          <h1 className="text-2xl font-semibold tracking-tight">
            E-Mail erfolgreich verifiziert!
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
            variant="default"
            onClick={() => router.push(`/${locale}/login`)}
          >
            Jetzt anmelden
          </Button>
          <Link
            href={`/${locale}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
