"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { HeaderLanguageSwitcher } from "@/components/dashboard/header-language-switcher";
import { ReactNode } from "react";

interface DashboardHeaderWithLanguageSwitcherProps {
  heading: string;
  text?: string;
  actions?: ReactNode;
}

export function DashboardHeaderWithLanguageSwitcher({
  heading,
  text,
  actions,
}: DashboardHeaderWithLanguageSwitcherProps) {
  return (
    <DashboardHeader heading={heading} text={text} actions={actions}>
      <HeaderLanguageSwitcher />
    </DashboardHeader>
  );
} 