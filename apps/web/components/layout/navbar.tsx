"use client";

import { useContext } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { docsConfig } from "@/config/docs";
import { marketingConfig } from "@/config/marketing";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DocsSearch } from "@/components/docs/search";
import LanguageDrawer from "@/components/language-drawer";
import { ModalContext } from "@/components/modals/providers";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { useSupabase } from "@/components/supabase-provider";

import { ModeToggle } from "./mode-toggle";
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
  const documentation = selectedLayout === "docs";

  const configMap = {
    docs: docsConfig.mainNav,
  };

  const links =
    (selectedLayout && configMap[selectedLayout]) || marketingConfig.mainNav;

  return (
    <header
      className={`sticky top-0 z-40 flex w-full justify-center bg-background/60 backdrop-blur-xl transition-all ${
        scroll ? (scrolled ? "border-b" : "bg-transparent") : "border-b"
      }`}
    >
      <MaxWidthWrapper
        className="flex h-14 items-center justify-between py-4"
        large={documentation}
      >
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-1.5">
            <Icons.logo />
            <span className="font-urban text-xl font-bold">
              {meta("shortName")}
            </span>
          </Link>

          {links && links.length > 0 ? (
            <nav className="hidden gap-6 md:flex">
              {links.map((item, index) => (
                <Link
                  key={index}
                  href={item.disabled ? "#" : item.href}
                  className={cn(
                    "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
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

        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Language Switcher - Now using drawer for all screen sizes */}
          <div className="flex items-center pr-2 md:pr-0">
            <LanguageDrawer />
          </div>

          {/* Theme Toggle - Always visible */}
          <ModeToggle />

          {/* right header for docs */}
          {documentation ? (
            <div className="flex flex-1 items-center space-x-4 sm:justify-end">
              <div className="flex-grow-0">
                <DocsSearch />
              </div>
              <div className="flex space-x-4">
                <Link
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icons.gitHub className="size-7" />
                  <span className="sr-only">GitHub</span>
                </Link>
              </div>
            </div>
          ) : null}

          {session ? (
            <div className="pr-0 md:pr-0">
              <UserAccountNav />
            </div>
          ) : (
            <>
              <Button
                className="hidden gap-2 px-5 md:flex"
                variant="default"
                size="sm"
                rounded="full"
                onClick={() => setShowSignInModal(true)}
              >
                <span>{t("signIn")}</span>
                <Icons.arrowRight className="size-4" />
              </Button>

              <Button
                className="hidden gap-2 px-5 md:flex"
                variant="outline"
                size="sm"
                rounded="full"
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
