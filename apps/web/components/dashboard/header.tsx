import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { ModernPageHeader } from "@/components/layout/modern-page-header";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  icon?: LucideIcon;
  showBackButton?: boolean;
  backHref?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  icon: Icon,
  showBackButton = false,
  backHref,
  children,
  actions,
}: DashboardHeaderProps) {
  return (
    <ModernPageHeader
      title={heading}
      description={text}
      icon={Icon ? <Icon className="h-5 w-5 text-primary" /> : undefined}
      showBackButton={showBackButton}
      backHref={backHref}
      actions={actions || children}
    />
  );
}
