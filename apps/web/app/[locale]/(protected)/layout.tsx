import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { siteConfig } from "@/config/site";
import LanguageDrawer from "@/components/language-drawer";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { UserAccountNav } from "@/components/layout/user-account-nav";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export const dynamic = "force-dynamic";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();
  const t = await getTranslations("Meta");

  if (!user) redirect("/login");

  return (
    <div className="relative flex min-h-screen w-full">
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-14 bg-background px-4 lg:h-[60px] xl:px-8 border-b">
          <MaxWidthWrapper className="flex max-w-7xl items-center gap-x-3 px-0">
            <Link href="/" className="flex items-center space-x-1.5">
              <Icons.logo />
              <span className="font-urban text-xl font-bold">
                {t("shortName")}
              </span>
            </Link>

            <div className="w-full flex-1" />

            <LanguageDrawer />
            <ModeToggle />
            <UserAccountNav />
          </MaxWidthWrapper>
        </header>

        <main className="flex-1 p-4 xl:px-8">
          <MaxWidthWrapper className="flex h-full max-w-7xl flex-col gap-4 px-0 lg:gap-6">
            {children}
          </MaxWidthWrapper>
        </main>
      </div>
    </div>
  );
}
