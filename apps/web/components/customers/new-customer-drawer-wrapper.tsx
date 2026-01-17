"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { ButtonRoot } from "@/components/ui/button";

import { NewCustomerDrawer } from "./new-customer-drawer";

export function NewCustomerDrawerWrapper() {
  const t = useTranslations("Customers");

  return (
    <NewCustomerDrawer
      trigger={
        <ButtonRoot className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">{t("newCustomer")}</span>
          <span className="sm:hidden">{t("new")}</span>
        </ButtonRoot>
      }
    />
  );
}
