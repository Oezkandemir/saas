import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSystemSettings } from "../api/admin-settings";
import {
  Settings,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { AdminSettingsDrawer } from "../components/settings/admin-settings-drawer";
import { AlertBanner } from "../components/ui/alert-banner";
import { TwoFactorAuth } from "../components/security/TwoFactorAuth";
import { settingDefinitions, settingCategories } from "../lib/settings-config";
import type { SettingDefinition, SettingCategory } from "../types/settings";

export default function SettingsPage() {
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: () => getSystemSettings(),
  });

  const handleExport = () => {
    // Export functionality will be handled in the drawer component
  };

  const handleImport = () => {
    // Import functionality will be handled in the drawer component
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">System configuration</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="animate-pulse space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage system configuration and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button
            variant="outline"
            onClick={handleImport}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import All
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Two-Factor Authentication Section */}
        <TwoFactorAuth />

        {/* System Settings */}
        <AdminSettingsDrawer
          settingDefinitions={settingDefinitions}
          settingCategories={settingCategories}
        />
      </div>
    </div>
  );
}
