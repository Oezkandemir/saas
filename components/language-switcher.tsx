"use client";

import { usePathname } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobeIcon } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  const switchLanguage = (locale: string) => {
    router.replace(pathname, { locale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <GlobeIcon className="h-5 w-5" />
          <span className="sr-only">{t("switchLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLanguage("en")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLanguage("de")}>
          Deutsch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 