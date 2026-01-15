"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ModernPageHeader } from "./modern-page-header";
import { StatusBar, type StatusBarItem } from "./status-bar";

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
}

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
}: UnifiedPageLayoutProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Page Header - Directly below main header, border-bottom for separation, symmetric padding */}
      <div className="bg-background border-b border-border">
        <div className="px-4 xl:px-8 py-[5px]">
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

      {/* Content - Konsistente Padding, reduzierte Gaps */}
      <div
        className={cn(
          "flex-1 overflow-y-auto p-4 xl:px-8 sm:py-6",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
