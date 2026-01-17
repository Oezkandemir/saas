import { useTranslations } from "next-intl";
import type * as React from "react";
import { ModeToggle } from "@/components/layout/mode-toggle";

import { footerLinks, siteConfig } from "@/config/site";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { NewsletterForm } from "../forms/newsletter-form";
import { Icons } from "../shared/icons";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  const t = useTranslations("Footer");

  return (
    <footer className={cn("border-t", className)}>
      <div className="container grid max-w-6xl grid-cols-2 gap-6 py-14 md:grid-cols-5">
        {footerLinks.map((section) => (
          <div key={section.title}>
            <span className="text-sm font-medium text-foreground">
              {t(`sections.${section.title.toLowerCase()}`)}
            </span>
            <ul className="mt-4 list-inside space-y-3">
              {section.items?.map((link) => {
                const isDocsSection = section.title === "Docs";
                const linkKey = link.title.toLowerCase().replace(/\s+/g, "_");

                if (isDocsSection) {
                  // Disable documentation links (not clickable)
                  return (
                    <li key={link.title}>
                      <span
                        className="text-sm text-muted-foreground/50 cursor-not-allowed pointer-events-none select-none"
                        aria-disabled="true"
                      >
                        {t(`links.${linkKey}`)}
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {t(`links.${linkKey}`)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="col-span-full sm:col-span-1 md:col-span-2">
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t py-4">
        <div className="container grid max-w-6xl grid-cols-3 items-center">
          <p className="col-span-3 text-center text-sm text-muted-foreground sm:col-span-1">
            Powered by Cenety &copy; 2025.
          </p>

          <div className="col-span-3 mt-4 flex items-center justify-center gap-3 sm:col-span-1 sm:mt-0 sm:justify-end">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              <Icons.gitHub className="size-5" />
            </Link>
            <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
