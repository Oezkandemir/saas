import { Link, useLocation } from "react-router-dom";
import { adminSidebarLinks } from "../../config/admin";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  LineChart,
  DollarSign,
  CreditCard,
  UserCog,
  Webhook,
  Mail,
  Building,
  FileText,
  Activity,
  QrCode,
  Calendar,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  layoutDashboard: LayoutDashboard,
  users: Users,
  help: HelpCircle,
  lineChart: LineChart,
  dollarSign: DollarSign,
  billing: CreditCard,
  userCog: UserCog,
  webhook: Webhook,
  mail: Mail,
  building: Building,
  fileText: FileText,
  activity: Activity,
  qrCode: QrCode,
  calendar: Calendar,
  settings: Settings,
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          {onMobileClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminSidebarLinks.map((section) => (
            <div key={section.title} className="space-y-1">
              {section.title && (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
