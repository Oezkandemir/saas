"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ModernPageHeader } from "./modern-page-header";
import { StatusBar, StatusBarItem } from "./status-bar";

interface UnifiedPageLayoutProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  actions?: ReactNode;
  statusBarItems?: StatusBarItem[];
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  stickyHeader?: boolean;
}

// Calculate offsets for sticky positioning
// Main header height: h-14 (56px) on mobile, lg:h-[60px] (60px) on desktop
const MAIN_HEADER_HEIGHT_DESKTOP = 60; // lg:h-[60px]
const PAGE_HEADER_HEIGHT = 52; // Height of page header (py-3 sm:py-3.5, approximately)

export function UnifiedPageLayout({
  title,
  description,
  icon,
  showBackButton,
  backHref,
  actions,
  statusBarItems,
  children,
  className,
  contentClassName,
  stickyHeader = true,
}: UnifiedPageLayoutProps) {
  // Calculate top offsets for sticky positioning relative to main header
  // Main header is at top-0, page header starts directly below it
  // Use responsive values: mobile (56px) and desktop (60px)
  const pageHeaderTop = MAIN_HEADER_HEIGHT_DESKTOP;
  const statusBarTop = MAIN_HEADER_HEIGHT_DESKTOP + PAGE_HEADER_HEIGHT;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Page Header - Directly below main header, border-bottom for separation, symmetric padding */}
      <div className="bg-background border-b border-border">
        <div className="px-4 xl:px-8 pt-[5px] pb-[5px]">
          <ModernPageHeader
            title={title}
            description={description}
            icon={icon}
            showBackButton={showBackButton}
            backHref={backHref}
            actions={actions}
            sticky={false}
          />
        </div>
      </div>

      {/* Status Bar - optional, below page header */}
      {statusBarItems && statusBarItems.length > 0 && (
        <div className="bg-background border-b border-border">
          <div className="px-4 xl:px-8">
            <StatusBar items={statusBarItems} />
          </div>
        </div>
      )}

      {/* Content - Natural flow with proper padding */}
      <div className={cn("flex-1 overflow-y-auto px-4 xl:px-8 py-4 sm:py-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

