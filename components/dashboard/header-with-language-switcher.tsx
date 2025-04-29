"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { HeaderLanguageSwitcher } from "@/components/dashboard/header-language-switcher";

interface DashboardHeaderWithLanguageSwitcherProps {
  heading: string;
  text?: string;
}

export function DashboardHeaderWithLanguageSwitcher({
  heading,
  text,
}: DashboardHeaderWithLanguageSwitcherProps) {
  return (
    <DashboardHeader heading={heading} text={text}>
      <HeaderLanguageSwitcher />
    </DashboardHeader>
  );
} 