"use client";

import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/header";

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
  // Note: Language switcher is now available in the navbar for all pages
  // This component now just renders the regular DashboardHeader
  return <DashboardHeader heading={heading} text={text} actions={actions} />;
}
