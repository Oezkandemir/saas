import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

import { footerLinks, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/layout/mode-toggle";

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
              {section.items?.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {t(`links.${link.title.toLowerCase().replace(/\s+/g, '_')}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-full flex flex-col items-end sm:col-span-1 md:col-span-2">
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t py-4">
        <div className="container grid max-w-6xl grid-cols-3 items-center">
          <div className="hidden sm:block"></div>
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
