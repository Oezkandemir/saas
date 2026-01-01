"use client";

import { useState, useEffect } from "react";
import { SidebarNavItem } from "@/types";
import { DashboardSidebar as DashboardSidebarComponent, MobileSheetSidebar as MobileSheetSidebarComponent } from "./dashboard-sidebar";

interface DashboardSidebarWrapperProps {
  links: SidebarNavItem[];
  isFreePlan?: boolean;
}

export function DashboardSidebar({ links, isFreePlan = true }: DashboardSidebarWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return minimal placeholder during SSR - hidden on mobile/tablet
    return (
      <div className="sticky top-0 h-full border-r bg-background">
        <aside className="hidden h-screen w-[68px] lg:flex lg:flex-col">
          <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px]" />
        </aside>
      </div>
    );
  }

  return <DashboardSidebarComponent links={links} isFreePlan={isFreePlan} />;
}

export function MobileSheetSidebar({ links, isFreePlan = true }: DashboardSidebarWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <MobileSheetSidebarComponent links={links} isFreePlan={isFreePlan} />;
}

