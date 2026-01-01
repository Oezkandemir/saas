"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "next-themes";
import { updateUserPreferences, type ExtendedPreferences } from "@/actions/preferences-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Bell, 
  Globe, 
  Calendar, 
  Clock, 
  DollarSign, 
  Mail, 
  Moon, 
  Sun, 
  Monitor,
  Loader2
} from "lucide-react";

const preferencesSchema = z.object({
  theme_preference: z.enum(["system", "light", "dark"]),
  language_preference: z.string(),
  locale: z.string(),
  timezone: z.string(),
  date_format: z.enum(["DD.MM.YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD/MM/YYYY"]),
  time_format: z.enum(["12h", "24h"]),
  currency: z.string().length(3),
  number_format: z.enum(["european", "american"]),
  email_digest_frequency: z.enum(["never", "daily", "weekly", "monthly"]),
  notification_preferences_granular: z.object({
    email: z.object({
      system: z.boolean(),
      billing: z.boolean(),
      security: z.boolean(),
      marketing: z.boolean(),
      support: z.boolean(),
      newsletter: z.boolean(),
    }),
    push: z.object({
      system: z.boolean(),
      billing: z.boolean(),
      security: z.boolean(),
      marketing: z.boolean(),
      support: z.boolean(),
      newsletter: z.boolean(),
    }),
    in_app: z.object({
      system: z.boolean(),
      billing: z.boolean(),
      security: z.boolean(),
      marketing: z.boolean(),
      support: z.boolean(),
      newsletter: z.boolean(),
    }),
  }),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface PreferencesPanelProps {
  initialPreferences: ExtendedPreferences;
}

export function PreferencesPanel({ initialPreferences }: PreferencesPanelProps) {
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const { register, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme_preference: initialPreferences.theme_preference as "system" | "light" | "dark",
      language_preference: initialPreferences.language_preference,
      locale: initialPreferences.locale,
      timezone: initialPreferences.timezone,
      date_format: initialPreferences.date_format as "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD/MM/YYYY",
      time_format: initialPreferences.time_format as "12h" | "24h",
      currency: initialPreferences.currency,
      number_format: initialPreferences.number_format as "european" | "american",
      email_digest_frequency: initialPreferences.email_digest_frequency as "never" | "daily" | "weekly" | "monthly",
      notification_preferences_granular: initialPreferences.notification_preferences_granular,
    },
  });

  const watchedPreferences = watch();

  // Sync theme preference with ThemeProvider when it changes
  useEffect(() => {
    if (watchedPreferences.theme_preference && watchedPreferences.theme_preference !== theme) {
      setTheme(watchedPreferences.theme_preference);
    }
  }, [watchedPreferences.theme_preference, theme, setTheme]);

  const onSubmit = async (data: PreferencesFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key === "notification_preferences_granular") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      const result = await updateUserPreferences(formData);

      if (result.success) {
        toast.success("Preferences updated successfully");
      } else {
        toast.error(result.error || "Failed to update preferences");
      }
    });
  };

  const updateNotificationPreference = (
    channel: "email" | "push" | "in_app",
    type: "system" | "billing" | "security" | "marketing" | "support" | "newsletter",
    value: boolean
  ) => {
    const current = watchedPreferences.notification_preferences_granular;
    setValue(
      "notification_preferences_granular",
      {
        ...current,
        [channel]: {
          ...current[channel],
          [type]: value,
        },
      },
      { shouldDirty: true }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Theme Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="size-4 text-muted-foreground" />
            <CardTitle>Theme Preferences</CardTitle>
          </div>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme_preference">Theme</Label>
            <Select
              value={watchedPreferences.theme_preference}
              onValueChange={(value) => {
                const themeValue = value as "system" | "light" | "dark";
                setValue("theme_preference", themeValue);
                // Apply theme immediately
                setTheme(themeValue);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="size-4" />
                    System
                  </div>
                </SelectItem>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="size-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="size-4" />
                    Dark
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" />
            <CardTitle>Language & Region</CardTitle>
          </div>
          <CardDescription>Configure language and regional settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="language_preference">Language</Label>
            <Select
              value={watchedPreferences.language_preference}
              onValueChange={(value) => setValue("language_preference", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="locale">Locale</Label>
            <Select
              value={watchedPreferences.locale}
              onValueChange={(value) => setValue("locale", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de-DE">de-DE (Germany)</SelectItem>
                <SelectItem value="en-US">en-US (United States)</SelectItem>
                <SelectItem value="en-GB">en-GB (United Kingdom)</SelectItem>
                <SelectItem value="fr-FR">fr-FR (France)</SelectItem>
                <SelectItem value="es-ES">es-ES (Spain)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={watchedPreferences.timezone}
              onValueChange={(value) => setValue("timezone", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                <SelectItem value="America/New_York">America/New_York</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Date/Time Format */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <CardTitle>Date & Time Format</CardTitle>
          </div>
          <CardDescription>Customize how dates and times are displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="date_format">Date Format</Label>
            <Select
              value={watchedPreferences.date_format}
              onValueChange={(value) => setValue("date_format", value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="time_format">Time Format</Label>
            <Select
              value={watchedPreferences.time_format}
              onValueChange={(value) => setValue("time_format", value as "12h" | "24h")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hour</SelectItem>
                <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Format */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-muted-foreground" />
            <CardTitle>Payment Format</CardTitle>
          </div>
          <CardDescription>Configure currency and number formatting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={watchedPreferences.currency}
              onValueChange={(value) => setValue("currency", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CHF">CHF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="number_format">Number Format</Label>
            <Select
              value={watchedPreferences.number_format}
              onValueChange={(value) => setValue("number_format", value as "european" | "american")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="european">European (1.234,56)</SelectItem>
                <SelectItem value="american">American (1,234.56)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email Digest */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <CardTitle>Email Digest</CardTitle>
          </div>
          <CardDescription>Configure how often you receive email summaries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email_digest_frequency">Email Digest Frequency</Label>
            <Select
              value={watchedPreferences.email_digest_frequency}
              onValueChange={(value) => setValue("email_digest_frequency", value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Granular Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>Fine-tune your notification settings by channel and type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(["email", "push", "in_app"] as const).map((channel) => (
            <div key={channel} className="space-y-4">
              <h4 className="text-sm font-semibold capitalize">{channel} Notifications</h4>
              <div className="space-y-3 pl-4">
                {(["system", "billing", "security", "support", "marketing", "newsletter"] as const).map((type) => (
                  <div key={type} className="flex items-center justify-between">
                    <Label htmlFor={`${channel}-${type}`} className="capitalize">
                      {type}
                    </Label>
                    <Switch
                      checked={watchedPreferences.notification_preferences_granular[channel][type]}
                      onCheckedChange={(checked) =>
                        updateNotificationPreference(channel, type, checked)
                      }
                    />
                  </div>
                ))}
              </div>
              {channel !== "in_app" && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </form>
  );
}

