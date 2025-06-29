"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { Drawer } from "vaul";

import { useRouter as useI18nRouter, usePathname } from "@/i18n/routing";

export default function LanguageDrawer() {
  const [open, setOpen] = useState(false);
  const router = useI18nRouter();
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  const switchLanguage = (locale: string) => {
    router.replace(pathname, { locale });
    setOpen(false);
  };

  return (
    <Drawer.Root open={open} onClose={() => setOpen(false)}>
      <Drawer.Trigger asChild>
        <button
          onClick={() => setOpen(true)}
          className="p-2 transition-colors duration-200 rounded-full hover:bg-muted focus:outline-none active:bg-muted"
          aria-label={t("switchLanguage")}
        >
          <Globe className="size-5 text-muted-foreground" />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-40 h-full bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 overflow-hidden rounded-t-[10px] border bg-background px-3 text-sm">
          <div className="sticky top-0 z-20 flex items-center justify-center w-full bg-inherit">
            <div className="my-3 h-1.5 w-16 rounded-full bg-muted-foreground/20" />
          </div>

          <Drawer.Title className="sr-only">Choose Language</Drawer.Title>

          <div className="w-full mt-1 mb-14">
            <div className="p-4">
              <h3 className="mb-4 text-lg font-semibold">
                {t("switchLanguage")}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => switchLanguage("en")}
                  className="flex items-center w-full gap-3 p-3 text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="text-2xl">🇺🇸</span>
                  <span className="font-medium">English</span>
                </button>
                <button
                  onClick={() => switchLanguage("de")}
                  className="flex items-center w-full gap-3 p-3 text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="text-2xl">🇩🇪</span>
                  <span className="font-medium">Deutsch</span>
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
        <Drawer.Overlay />
      </Drawer.Portal>
    </Drawer.Root>
  );
} 