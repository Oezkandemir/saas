import { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

type Props = {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function AuthErrorPage({ searchParams }: Props) {
  const errorMessage =
    searchParams.error?.toString() ||
    "Ein Fehler ist aufgetreten bei der Authentifizierung";

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.warning className="mx-auto size-12 text-yellow-500" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Authentifizierungsfehler
          </h1>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>

        <div className="grid gap-2">
          <Link
            href="/login"
            className={buttonVariants({ variant: "default" })}
          >
            Erneut anmelden
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "outline" })}
          >
            Konto erstellen
          </Link>
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
