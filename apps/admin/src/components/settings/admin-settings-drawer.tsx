import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPushNotificationService } from "../../lib/push-notifications";
import {
  getSystemSettings,
  updateSystemSetting,
  createSystemSetting,
  updateSystemSettings,
  resetSystemSetting,
  testEmailConfiguration,
  exportSettings,
  importSettings,
  type SystemSettings,
} from "../../api/admin-settings";
import {
  Settings,
  Save,
  Globe,
  Mail,
  Bell,
  Shield,
  Palette,
  Database,
  Zap,
  RefreshCw,
  Download,
  Upload,
  TestTube,
  X,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { AlertBanner } from "../ui/alert-banner";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { LoadingButton } from "../ui/loading-button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { toast } from "sonner";
import { EmptyState } from "../ui/empty-state";
import { validateEmail, validateURL, validateRequired } from "../../lib/validation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "../ui/sheet";
import type { SettingDefinition, SettingCategory } from "../../types/settings";

interface AdminSettingsDrawerProps {
  settingDefinitions: Record<string, SettingDefinition>;
  settingCategories: SettingCategory[];
}

export function AdminSettingsDrawer({
  settingDefinitions,
  settingCategories,
}: AdminSettingsDrawerProps) {
  const queryClient = useQueryClient();
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">("system");
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");

  // Detect current theme from localStorage and DOM
  useEffect(() => {
    const detectTheme = () => {
      const stored = localStorage.getItem("theme") as "light" | "dark" | null;
      const hasDarkClass = document.documentElement.classList.contains("dark");
      
      if (stored) {
        setCurrentTheme(stored);
      } else if (hasDarkClass) {
        setCurrentTheme("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setCurrentTheme(prefersDark ? "dark" : "light");
      }
    };

    detectTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Listen for localStorage changes
    const handleStorageChange = () => detectTheme();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Check push notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
      
      // Listen for permission changes
      const checkPermission = () => {
        setPushPermission(Notification.permission);
      };
      
      // Poll for permission changes (Notification API doesn't have an event)
      const interval = setInterval(checkPermission, 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: () => getSystemSettings(),
  });

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateSystemSetting(key, value),
    onSuccess: (_, variables) => {
      // For theme, ensure it's applied (already applied in handleSave, but ensure consistency)
      if (variables.key === "appearance.theme") {
        applyTheme(variables.value as "light" | "dark" | "system");
      }
      
      // For push notifications, clear the immediate localStorage flag
      if (variables.key === "notifications.push_enabled") {
        localStorage.removeItem("notifications.push_enabled.immediate");
      }
      
      // For 2FA requirement, immediately invalidate and refetch
      if (variables.key === "security.require_2fa") {
        queryClient.invalidateQueries({ queryKey: ["two-factor-required"] });
        queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
        // Force immediate refetch
        queryClient.refetchQueries({ queryKey: ["two-factor-required"] });
        queryClient.refetchQueries({ queryKey: ["two-factor-status"] });
      }
      
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      setEditedSettings((prev) => {
        const next = { ...prev };
        delete next[variables.key];
        return next;
      });
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[variables.key];
        return next;
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Only show toast for non-push settings (push settings show immediate feedback)
      if (variables.key !== "notifications.push_enabled") {
        toast.success("Setting saved successfully");
      }
    },
    onError: (error: Error, variables) => {
      // Clear immediate flag on error
      if (variables?.key === "notifications.push_enabled") {
        localStorage.removeItem("notifications.push_enabled.immediate");
      }
      toast.error(error.message || "Failed to save setting");
    },
  });

  const bulkUpdateSettings = useMutation({
    mutationFn: (updates: Array<{ key: string; value: string }>) =>
      updateSystemSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      setEditedSettings({});
      setValidationErrors({});
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast.success("Settings saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  const resetSetting = useMutation({
    mutationFn: ({ key, defaultValue }: { key: string; defaultValue: string }) =>
      resetSystemSetting(key, defaultValue),
    onSuccess: (_, variables) => {
      // For theme, apply the reset value
      if (variables.key === "appearance.theme") {
        applyTheme(variables.defaultValue as "light" | "dark" | "system");
      }
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      setResettingKey(null);
      toast.success("Setting reset to default");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset setting");
    },
  });

  const testEmail = useMutation({
    mutationFn: () => testEmailConfiguration(),
    onSuccess: () => {
      setTestingEmail(false);
      toast.success("Email test successful! Check your inbox.");
    },
    onError: (error: Error) => {
      setTestingEmail(false);
      toast.error(error.message || "Email test failed");
    },
  });

  const exportSettingsMutation = useMutation({
    mutationFn: () => exportSettings(),
    onSuccess: (data) => {
      if (data.data) {
        const blob = new Blob([data.data], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `settings-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Settings exported successfully");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export settings");
    },
  });

  const importSettingsMutation = useMutation({
    mutationFn: (jsonData: string) => importSettings(jsonData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Settings imported successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to import settings");
    },
  });

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          importSettingsMutation.mutate(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const settings = settingsResponse?.data || [];
  const settingsMap = new Map(settings.map((s) => [s.key, s]));

  const getCategorySettings = (categoryId: string) => {
    return Object.values(settingDefinitions).filter((s) => s.category === categoryId);
  };

  const getGroupedSettings = (categoryId: string) => {
    const categorySettings = getCategorySettings(categoryId);
    const groups = new Map<string, SettingDefinition[]>();
    categorySettings.forEach((setting) => {
      const group = setting.group || "Other";
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(setting);
    });
    return Array.from(groups.entries()).map(([group, settings]) => ({
      group,
      settings,
    }));
  };

  const hasUnsavedChanges = Object.keys(editedSettings).length > 0;
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const applyTheme = (theme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    let actualTheme: "light" | "dark" = "light";
    
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      actualTheme = prefersDark ? "dark" : "light";
    } else {
      actualTheme = theme;
    }
    
    if (actualTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", actualTheme);
    setCurrentTheme(actualTheme);
  };

  const handleSave = (key: string) => {
    const value = editedSettings[key];
    if (value === undefined) return;

    // Special handling for theme - apply immediately
    if (key === "appearance.theme") {
      applyTheme(value as "light" | "dark" | "system");
    }

    const settingDef = settingDefinitions[key];
    if (settingDef?.validation) {
      const validation = settingDef.validation(value);
      if (validation !== true) {
        setValidationErrors((prev) => ({
          ...prev,
          [key]: typeof validation === "string" ? validation : "Invalid value",
        }));
        return;
      }
    }

    const setting = settingsMap.get(key);
    if (setting) {
      updateSetting.mutate({ key, value });
    } else {
      const def = settingDefinitions[key];
      createSystemSetting(key, value, def?.description, def?.category).then(() => {
        queryClient.invalidateQueries({ queryKey: ["system-settings"] });
        setEditedSettings((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        toast.success("Setting saved successfully");
      });
    }
  };

  const handleBulkSave = () => {
    const updates = Object.entries(editedSettings)
      .filter(([key]) => !validationErrors[key])
      .map(([key, value]) => ({ key, value }));

    if (updates.length === 0) {
      toast.error("No valid changes to save");
      return;
    }

    bulkUpdateSettings.mutate(updates);
  };

  const handleReset = (key: string) => {
    const def = settingDefinitions[key];
    if (def) {
      // For theme, apply the default immediately
      if (key === "appearance.theme") {
        applyTheme(def.defaultValue as "light" | "dark" | "system");
      }
      resetSetting.mutate({ key, defaultValue: def.defaultValue });
    }
  };

  const handleTestEmail = () => {
    setTestingEmail(true);
    testEmail.mutate();
  };

  const getSettingValue = (key: string): string => {
    // Special handling for appearance.theme - show current theme if not set
    if (key === "appearance.theme") {
      if (editedSettings[key] !== undefined) {
        return editedSettings[key];
      }
      const setting = settingsMap.get(key);
      if (setting && setting.value) {
        return setting.value;
      }
      // If no setting exists, return current theme (not "system")
      return currentTheme === "system" ? "light" : currentTheme;
    }
    
    if (editedSettings[key] !== undefined) {
      return editedSettings[key];
    }
    const setting = settingsMap.get(key);
    if (setting && setting.value) {
      return setting.value;
    }
    const def = settingDefinitions[key];
    return def?.defaultValue || "";
  };

  const renderSettingInput = (settingDef: SettingDefinition) => {
    const key = settingDef.key;
    const value = getSettingValue(key);
    const hasChanges = editedSettings[key] !== undefined;
    const error = validationErrors[key];
    const currentValue = settingsMap.get(key)?.value;
    const isDefault = !currentValue || currentValue === settingDef.defaultValue;

    switch (settingDef.type) {
      case "boolean":
        const isPushSetting = key === "notifications.push_enabled";
        const pushService = isPushSetting ? getPushNotificationService() : null;
        const pushPermissionState = isPushSetting ? pushPermission : null;
        
        return (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">{settingDef.label}</Label>
                {isDefault && (
                  <Badge variant="outline" className="text-xs">Default</Badge>
                )}
                {isPushSetting && pushPermissionState === "granted" && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400">
                    Permission Granted
                  </Badge>
                )}
                {isPushSetting && pushPermissionState === "denied" && (
                  <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400">
                    Permission Denied
                  </Badge>
                )}
                {isPushSetting && pushPermissionState === "default" && (
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                    Permission Required
                  </Badge>
                )}
              </div>
              {settingDef.description && (
                <p className="text-sm text-muted-foreground">
                  {settingDef.description}
                </p>
              )}
              {isPushSetting && pushPermissionState === "denied" && (
                <p className="text-xs text-red-600 dark:text-red-400 italic">
                  Browser permission denied. Please enable notifications in your browser settings.
                </p>
              )}
              {isPushSetting && pushPermissionState === "default" && value === "true" && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                  Click the switch to enable, then grant browser permission when prompted.
                </p>
              )}
              {settingDef.helpText && (
                <p className="text-xs text-muted-foreground italic">
                  {settingDef.helpText}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={value === "true"}
                onCheckedChange={async (checked) => {
                  // For push notifications, request permission when enabling
                  if (isPushSetting && checked && pushPermissionState === "default") {
                    try {
                      await pushService?.requestPermission();
                      setPushPermission(Notification.permission);
                      if (Notification.permission === "denied") {
                        toast.error("Push notification permission denied. Please enable it in your browser settings.");
                        return; // Don't enable the setting if permission is denied
                      }
                    } catch (error) {
                      console.error("Failed to request push notification permission:", error);
                      toast.error("Failed to request push notification permission");
                      return;
                    }
                  }
                  
                  // Store immediate value in localStorage for real-time updates
                  if (isPushSetting) {
                    localStorage.setItem("notifications.push_enabled.immediate", checked.toString());
                    // Clear after a delay to allow React Query to catch up
                    setTimeout(() => {
                      localStorage.removeItem("notifications.push_enabled.immediate");
                    }, 5000);
                  }
                  
                  // Update edited settings first
                  const newValue = checked.toString();
                  setEditedSettings((prev) => ({
                    ...prev,
                    [key]: newValue,
                  }));
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                  
                  // For push notifications, apply immediately (save in background)
                  if (isPushSetting) {
                    // Save immediately without waiting for user to click Save
                    // Use setTimeout to ensure state is updated first
                    setTimeout(() => {
                      handleSave(key);
                    }, 0);
                  }
                }}
              />
              {hasChanges && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditedSettings((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    size="sm"
                    onClick={() => handleSave(key)}
                    loading={updateSetting.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </LoadingButton>
                </div>
              )}
              {!isDefault && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setResettingKey(key)}
                  title="Reset to default"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );

      case "select":
        // Special handling for theme setting
        const isThemeSetting = key === "appearance.theme";
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">{settingDef.label}</Label>
              {isDefault && !isThemeSetting && (
                <Badge variant="outline" className="text-xs">Default</Badge>
              )}
              {isThemeSetting && (
                <Badge variant="outline" className="text-xs">
                  Current: {currentTheme === "system" ? "System" : currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
                </Badge>
              )}
            </div>
            {settingDef.description && (
              <p className="text-sm text-muted-foreground">
                {settingDef.description}
              </p>
            )}
            {settingDef.helpText && (
              <p className="text-xs text-muted-foreground italic">
                {settingDef.helpText}
              </p>
            )}
            <div className="flex gap-2 items-center flex-wrap">
              <Select
                value={value || settingDef.defaultValue || ""}
                onValueChange={(newValue) => {
                  // For theme, apply immediately for preview
                  if (isThemeSetting) {
                    applyTheme(newValue as "light" | "dark" | "system");
                  }
                  
                  // Mark as changed when user selects a value
                  setEditedSettings((prev) => ({
                    ...prev,
                    [key]: newValue,
                  }));
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                }}
              >
                <SelectTrigger className={`flex-1 min-w-[200px] ${error ? "border-destructive" : ""}`}>
                  <SelectValue placeholder={settingDef.placeholder || "Select an option"} />
                </SelectTrigger>
                <SelectContent>
                  {settingDef.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      <div className="flex items-center gap-2">
                        {isThemeSetting && option !== "system" && (
                          <div className={`w-3 h-3 rounded-full border ${
                            option === "light" ? "bg-white border-gray-300" : "bg-gray-900 border-gray-700"
                          }`} />
                        )}
                        <span>
                          {option === "system" ? "System (Follow OS)" : option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, " ")}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasChanges && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      // For theme, revert to original
                      if (isThemeSetting) {
                        const originalValue = settingsMap.get(key)?.value || settingDef.defaultValue || "system";
                        applyTheme(originalValue as "light" | "dark" | "system");
                      }
                      setEditedSettings((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(key);
                    }}
                    loading={updateSetting.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isThemeSetting ? "Save Theme" : "Save"}
                  </LoadingButton>
                </div>
              )}
              {!isDefault && !isThemeSetting && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setResettingKey(key);
                  }}
                  title="Reset to default"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isThemeSetting && !hasChanges && (
              <p className="text-xs text-muted-foreground italic">
                💡 Tip: Select a theme to preview it immediately. Click Save to persist your choice.
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">{settingDef.label}</Label>
              {isDefault && (
                <Badge variant="outline" className="text-xs">Default</Badge>
              )}
            </div>
            {settingDef.description && (
              <p className="text-sm text-muted-foreground">
                {settingDef.description}
              </p>
            )}
            {settingDef.helpText && (
              <p className="text-xs text-muted-foreground italic">
                {settingDef.helpText}
              </p>
            )}
            <div className="flex gap-2">
              <Textarea
                value={value}
                onChange={(e) => {
                  setEditedSettings((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }));
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                }}
                placeholder={settingDef.placeholder}
                className={`flex-1 ${error ? "border-destructive" : ""}`}
                rows={4}
              />
              {hasChanges && (
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditedSettings((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    size="sm"
                    onClick={() => handleSave(key)}
                    loading={updateSetting.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </LoadingButton>
                </div>
              )}
              {!isDefault && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setResettingKey(key)}
                  title="Reset to default"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">{settingDef.label}</Label>
              {isDefault && (
                <Badge variant="outline" className="text-xs">Default</Badge>
              )}
            </div>
            {settingDef.description && (
              <p className="text-sm text-muted-foreground">
                {settingDef.description}
              </p>
            )}
            {settingDef.helpText && (
              <p className="text-xs text-muted-foreground italic">
                {settingDef.helpText}
              </p>
            )}
            <div className="flex gap-2 items-center flex-wrap">
              {key.includes("_color") ? (
                <div className="flex gap-2 flex-1 items-center">
                  <Input
                    type="color"
                    value={value || settingDef.defaultValue || "#000000"}
                    onChange={(e) => {
                      setEditedSettings((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }));
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={value || settingDef.defaultValue || ""}
                    onChange={(e) => {
                      setEditedSettings((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }));
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                    placeholder={settingDef.placeholder}
                    className={`flex-1 ${error ? "border-destructive" : ""}`}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    title="Hex color code (e.g., #000000)"
                  />
                </div>
              ) : (
                <Input
                  type={settingDef.type === "password" ? "password" : settingDef.type === "number" ? "number" : settingDef.type === "url" ? "url" : settingDef.type === "email" ? "email" : "text"}
                  value={value || ""}
                  onChange={(e) => {
                    setEditedSettings((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }));
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next[key];
                      return next;
                    });
                  }}
                  placeholder={settingDef.placeholder}
                  className={`flex-1 ${error ? "border-destructive" : ""}`}
                />
              )}
              {hasChanges && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditedSettings((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(key);
                    }}
                    loading={updateSetting.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </LoadingButton>
                </div>
              )}
              {!isDefault && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setResettingKey(key);
                  }}
                  title="Reset to default"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
        );
    }
  };

  const activeCategory = settingCategories.find((c) => c.id === openDrawer);
  const groupedSettings = openDrawer ? getGroupedSettings(openDrawer) : [];

  return (
    <>
      {/* Settings Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {settingCategories.map((category) => {
          const Icon = category.icon;
          const categorySettings = getCategorySettings(category.id);
          return (
            <Card
              key={category.id}
              className="h-full transition-all cursor-pointer hover:border-primary/50 group"
              onClick={() => setOpenDrawer(category.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold break-words">
                        {category.label}
                      </h3>
                      <p className="text-xs break-words text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {categorySettings.length} settings
                    </span>
                    <div className="flex items-center text-xs text-primary group-hover:underline">
                      {isLoading ? "Loading..." : "Manage"}
                      <ArrowRight className="ml-1 transition-transform size-3 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Drawer */}
      <Sheet open={openDrawer !== null} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
          {activeCategory && (
            <>
              <SheetHeader className="border-b pb-4 mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                      <activeCategory.icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle>{activeCategory.label}</SheetTitle>
                      <SheetDescription className="mt-1">
                        {activeCategory.description}
                      </SheetDescription>
                    </div>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
              </SheetHeader>

              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {showSuccess && (
                  <AlertBanner
                    variant="success"
                    message="Settings saved successfully!"
                    onDismiss={() => setShowSuccess(false)}
                  />
                )}

                {hasValidationErrors && (
                  <AlertBanner
                    variant="error"
                    message={`Please fix ${Object.keys(validationErrors).length} validation error(s) before saving`}
                  />
                )}

                <div className="flex items-center justify-between gap-2 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkSave}
                        disabled={hasValidationErrors || bulkUpdateSettings.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save All ({Object.keys(editedSettings).length})
                      </Button>
                    )}
                    {activeCategory.id === "email" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestEmail}
                        disabled={testingEmail}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {testingEmail ? "Testing..." : "Test Email"}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSettingsMutation.mutate()}
                      disabled={exportSettingsMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImport}
                      disabled={importSettingsMutation.isPending}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </div>
                </div>

                {groupedSettings.length === 0 ? (
                  <EmptyState
                    icon={Settings}
                    title="No settings available"
                    description={`No settings configured for ${activeCategory.label.toLowerCase()} category`}
                  />
                ) : (
                  <div className="space-y-6">
                    {groupedSettings.map(({ group, settings }) => (
                      <div key={group} className="space-y-4">
                        {groupedSettings.length > 1 && (
                          <div className="pb-2 border-b">
                            <h3 className="text-base font-semibold">{group}</h3>
                          </div>
                        )}
                        <div className="space-y-4">
                          {settings.map((settingDef) => (
                            <div
                              key={settingDef.key}
                              className="p-4 border border-border rounded-lg bg-muted/30"
                            >
                              {renderSettingInput(settingDef)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reset Confirmation Dialog */}
      {resettingKey && (
        <ConfirmDialog
          open={!!resettingKey}
          onOpenChange={(open) => !open && setResettingKey(null)}
          onConfirm={() => {
            if (resettingKey) {
              handleReset(resettingKey);
            }
          }}
          title="Reset Setting"
          description={`Are you sure you want to reset "${settingDefinitions[resettingKey]?.label}" to its default value?`}
          confirmText="Reset"
          variant="default"
          loading={resetSetting.isPending}
        />
      )}
    </>
  );
}
