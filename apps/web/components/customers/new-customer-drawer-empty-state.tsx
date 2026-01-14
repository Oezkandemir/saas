"use client";

import { useTranslations } from "next-intl";

import { ButtonRoot } from "@/components/ui/button";

import { NewCustomerDrawer } from "./new-customer-drawer";

export function NewCustomerDrawerEmptyState() {
  const t = useTranslations("Customers");

  return (
    <NewCustomerDrawer
      trigger={
        <ButtonRoot size="sm" variant="outline" className="mt-3 h-8 text-xs">
          {t("empty.createFirst")}
        </ButtonRoot>
      }
    />
  );
}
