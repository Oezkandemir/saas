"use client";

import { useContext } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { marketingConfig } from "@/config/marketing";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/alignui/actions/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModalContext } from "@/components/modals/providers";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { useSupabase } from "@/components/supabase-provider";

import { UserAccountNav } from "./user-account-nav";

interface NavBarProps {
  scroll?: boolean;
  large?: boolean;
}

export function NavBar({ scroll = false }: NavBarProps) {
  const scrolled = useScroll(50);
  const { session } = useSupabase();
  const { setShowSignInModal, setShowSignUpModal } = useContext(ModalContext);
  const t = useTranslations("Navigation");
  const meta = useTranslations("Meta");

  const selectedLayout = useSelectedLayoutSegment();
  const links = marketingConfig.mainNav;

  return (
    <header
      className={`sticky top-0 z-40 flex w-full justify-center bg-background/60 backdrop-blur-xl transition-all ${
        scroll ? (scrolled ? "border-b" : "bg-transparent") : "border-b"
      }`}
    >
      <MaxWidthWrapper
        className="flex h-14 sm:h-16 items-center justify-between py-3 sm:py-4 px-4 sm:px-6"
      >
        <div className="flex gap-4 sm:gap-6 md:gap-10 items-center min-w-0 flex-1">
          <Link
            href="/"
            prefetch={true}
            className="flex items-center space-x-1.5 shrink-0"
          >
            <Icons.logo className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="font-urban text-base sm:text-lg md:text-xl font-bold">
              {meta("shortName")}
            </span>
          </Link>

          {links && links.length > 0 ? (
            <nav className="hidden gap-4 md:flex md:gap-6">
              {links.map((item, index) => (
                <Link
                  key={index}
                  href={item.disabled ? "#" : item.href}
                  prefetch={!item.disabled}
                  className={cn(
                    "flex items-center text-base font-medium transition-colors hover:text-foreground/80 lg:text-sm",
                    item.href.startsWith(`/${selectedLayout}`)
                      ? "text-foreground"
                      : "text-foreground/60",
                    item.disabled && "cursor-not-allowed opacity-80",
                  )}
                >
                  {t(item.title.toLowerCase())}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center pr-1 sm:pr-2 md:pr-0">
            <LanguageSwitcher />
          </div>


          {session ? (
            <div className="flex items-center gap-1 sm:gap-2 pr-0 md:pr-0">
              <Link
                href="/dashboard"
                prefetch={true}
                className={cn(
                  "hidden items-center rounded-full border border-input bg-background px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground md:flex touch-manipulation",
                )}
              >
                {t("dashboard")}
              </Link>
              <UserAccountNav />
            </div>
          ) : (
            <>
              {/* Icon button for small screens */}
              <Button
                className="flex md:hidden gap-2 px-3 py-2 text-sm touch-manipulation rounded-full"
                variant="primary"
                size="sm"
                onClick={() => setShowSignInModal(true)}
                aria-label={t("signIn")}
              >
                <Icons.user className="size-4" />
              </Button>

              {/* Text button for larger screens */}
              <Button
                className="hidden gap-2 px-4 sm:px-5 text-sm md:flex touch-manipulation rounded-full"
                variant="primary"
                size="sm"
                onClick={() => setShowSignInModal(true)}
              >
                <span>{t("signIn")}</span>
                <Icons.arrowRight className="size-3 sm:size-4" />
              </Button>

              <Button
                className="hidden gap-2 px-4 sm:px-5 text-sm md:flex touch-manipulation rounded-full"
                variant="outline"
                size="sm"
                onClick={() => setShowSignUpModal(true)}
              >
                <span>{t("signUp")}</span>
              </Button>
            </>
          )}
        </div>
      </MaxWidthWrapper>
    </header>
  );
}
