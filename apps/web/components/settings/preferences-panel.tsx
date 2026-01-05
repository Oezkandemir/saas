"use client";

import { useEffect, useTransition } from "react";
import {
  updateUserPreferences,
  type ExtendedPreferences,
} from "@/actions/preferences-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  Calendar,
  DollarSign,
  Globe,
  Loader2,
  Mail,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/alignui/actions/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";

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
      customer: z.boolean(),
      document: z.boolean(),
      subscription: z.boolean(),
      invoice: z.boolean(),
      payment: z.boolean(),
    }),
    push: z.object({
      system: z.boolean(),
      billing: z.boolean(),
      security: z.boolean(),
      marketing: z.boolean(),
      support: z.boolean(),
      newsletter: z.boolean(),
      customer: z.boolean(),
      document: z.boolean(),
      subscription: z.boolean(),
      invoice: z.boolean(),
      payment: z.boolean(),
    }),
    in_app: z.object({
      system: z.boolean(),
      billing: z.boolean(),
      security: z.boolean(),
      marketing: z.boolean(),
      support: z.boolean(),
      newsletter: z.boolean(),
      customer: z.boolean(),
      document: z.boolean(),
      subscription: z.boolean(),
      invoice: z.boolean(),
      payment: z.boolean(),
    }),
  }),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface PreferencesPanelProps {
  initialPreferences: ExtendedPreferences;
}

export function PreferencesPanel({
  initialPreferences,
}: PreferencesPanelProps) {
  const t = useTranslations("Preferences");
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme_preference: initialPreferences.theme_preference as
        | "system"
        | "light"
        | "dark",
      language_preference: initialPreferences.language_preference,
      locale: initialPreferences.locale,
      timezone: initialPreferences.timezone,
      date_format: initialPreferences.date_format as
        | "DD.MM.YYYY"
        | "MM/DD/YYYY"
        | "YYYY-MM-DD"
        | "DD/MM/YYYY",
      time_format: initialPreferences.time_format as "12h" | "24h",
      currency: initialPreferences.currency,
      number_format: initialPreferences.number_format as
        | "european"
        | "american",
      email_digest_frequency: initialPreferences.email_digest_frequency as
        | "never"
        | "daily"
        | "weekly"
        | "monthly",
      notification_preferences_granular: {
        email: {
          system:
            initialPreferences.notification_preferences_granular?.email
              ?.system ?? true,
          billing:
            initialPreferences.notification_preferences_granular?.email
              ?.billing ?? true,
          security:
            initialPreferences.notification_preferences_granular?.email
              ?.security ?? true,
          marketing:
            initialPreferences.notification_preferences_granular?.email
              ?.marketing ?? false,
          support:
            initialPreferences.notification_preferences_granular?.email
              ?.support ?? true,
          newsletter:
            initialPreferences.notification_preferences_granular?.email
              ?.newsletter ?? false,
          customer:
            initialPreferences.notification_preferences_granular?.email
              ?.customer ?? true,
          document:
            initialPreferences.notification_preferences_granular?.email
              ?.document ?? true,
          subscription:
            initialPreferences.notification_preferences_granular?.email
              ?.subscription ?? true,
          invoice:
            initialPreferences.notification_preferences_granular?.email
              ?.invoice ?? true,
          payment:
            initialPreferences.notification_preferences_granular?.email
              ?.payment ?? true,
        },
        push: {
          system:
            initialPreferences.notification_preferences_granular?.push
              ?.system ?? true,
          billing:
            initialPreferences.notification_preferences_granular?.push
              ?.billing ?? true,
          security:
            initialPreferences.notification_preferences_granular?.push
              ?.security ?? true,
          marketing:
            initialPreferences.notification_preferences_granular?.push
              ?.marketing ?? false,
          support:
            initialPreferences.notification_preferences_granular?.push
              ?.support ?? true,
          newsletter:
            initialPreferences.notification_preferences_granular?.push
              ?.newsletter ?? false,
          customer:
            initialPreferences.notification_preferences_granular?.push
              ?.customer ?? true,
          document:
            initialPreferences.notification_preferences_granular?.push
              ?.document ?? true,
          subscription:
            initialPreferences.notification_preferences_granular?.push
              ?.subscription ?? true,
          invoice:
            initialPreferences.notification_preferences_granular?.push
              ?.invoice ?? true,
          payment:
            initialPreferences.notification_preferences_granular?.push
              ?.payment ?? true,
        },
        in_app: {
          system:
            initialPreferences.notification_preferences_granular?.in_app
              ?.system ?? true,
          billing:
            initialPreferences.notification_preferences_granular?.in_app
              ?.billing ?? true,
          security:
            initialPreferences.notification_preferences_granular?.in_app
              ?.security ?? true,
          marketing:
            initialPreferences.notification_preferences_granular?.in_app
              ?.marketing ?? false,
          support:
            initialPreferences.notification_preferences_granular?.in_app
              ?.support ?? true,
          newsletter:
            initialPreferences.notification_preferences_granular?.in_app
              ?.newsletter ?? false,
          customer:
            initialPreferences.notification_preferences_granular?.in_app
              ?.customer ?? true,
          document:
            initialPreferences.notification_preferences_granular?.in_app
              ?.document ?? true,
          subscription:
            initialPreferences.notification_preferences_granular?.in_app
              ?.subscription ?? true,
          invoice:
            initialPreferences.notification_preferences_granular?.in_app
              ?.invoice ?? true,
          payment:
            initialPreferences.notification_preferences_granular?.in_app
              ?.payment ?? true,
        },
      },
    },
  });

  const watchedPreferences = watch();

  // Sync theme preference with ThemeProvider when it changes
  useEffect(() => {
    if (
      watchedPreferences.theme_preference &&
      watchedPreferences.theme_preference !== theme
    ) {
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
        toast.success(t("saveSuccess"));
      } else {
        toast.error(result.error || t("saveError"));
      }
    });
  };

  const updateNotificationPreference = (
    channel: "email" | "push" | "in_app",
    type:
      | "system"
      | "billing"
      | "security"
      | "marketing"
      | "support"
      | "newsletter"
      | "customer"
      | "document"
      | "subscription"
      | "invoice"
      | "payment",
    value: boolean,
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
      { shouldDirty: true },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Theme Preferences */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <Monitor className="size-4 text-muted-foreground" />
            <CardTitle>{t("theme.title")}</CardTitle>
          </div>
          <CardDescription>{t("theme.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="theme_preference">{t("theme.themeLabel")}</Label>
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
                  <div className="flex gap-2 items-center">
                    <Monitor className="size-4" />
                    {t("theme.system")}
                  </div>
                </SelectItem>
                <SelectItem value="light">
                  <div className="flex gap-2 items-center">
                    <Sun className="size-4" />
                    {t("theme.light")}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex gap-2 items-center">
                    <Moon className="size-4" />
                    {t("theme.dark")}
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
          <div className="flex gap-2 items-center">
            <Globe className="size-4 text-muted-foreground" />
            <CardTitle>{t("languageRegion.title")}</CardTitle>
          </div>
          <CardDescription>{t("languageRegion.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="language_preference">
              {t("languageRegion.language")}
            </Label>
            <Select
              value={watchedPreferences.language_preference}
              onValueChange={(value) => setValue("language_preference", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  {t("languageRegion.languages.english")}
                </SelectItem>
                <SelectItem value="de">
                  {t("languageRegion.languages.german")}
                </SelectItem>
                <SelectItem value="fr">
                  {t("languageRegion.languages.french")}
                </SelectItem>
                <SelectItem value="es">
                  {t("languageRegion.languages.spanish")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center">
            <Label htmlFor="locale">{t("languageRegion.locale")}</Label>
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
          <div className="flex justify-between items-center">
            <Label htmlFor="timezone">{t("languageRegion.timezone")}</Label>
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
                <SelectItem value="America/New_York">
                  America/New_York
                </SelectItem>
                <SelectItem value="America/Los_Angeles">
                  America/Los_Angeles
                </SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Date/Time Format */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <Calendar className="size-4 text-muted-foreground" />
            <CardTitle>{t("dateTime.title")}</CardTitle>
          </div>
          <CardDescription>{t("dateTime.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="date_format">{t("dateTime.dateFormat")}</Label>
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
          <div className="flex justify-between items-center">
            <Label htmlFor="time_format">{t("dateTime.timeFormat")}</Label>
            <Select
              value={watchedPreferences.time_format}
              onValueChange={(value) =>
                setValue("time_format", value as "12h" | "24h")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">{t("dateTime.hour24")}</SelectItem>
                <SelectItem value="12h">{t("dateTime.hour12")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Format */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <DollarSign className="size-4 text-muted-foreground" />
            <CardTitle>{t("payment.title")}</CardTitle>
          </div>
          <CardDescription>{t("payment.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="currency">{t("payment.currency")}</Label>
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
          <div className="flex justify-between items-center">
            <Label htmlFor="number_format">{t("payment.numberFormat")}</Label>
            <Select
              value={watchedPreferences.number_format}
              onValueChange={(value) =>
                setValue("number_format", value as "european" | "american")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="european">
                  {t("payment.european")}
                </SelectItem>
                <SelectItem value="american">
                  {t("payment.american")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email Digest */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <Mail className="size-4 text-muted-foreground" />
            <CardTitle>{t("emailDigest.title")}</CardTitle>
          </div>
          <CardDescription>{t("emailDigest.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="email_digest_frequency">
              {t("emailDigest.frequency")}
            </Label>
            <Select
              value={watchedPreferences.email_digest_frequency}
              onValueChange={(value) =>
                setValue("email_digest_frequency", value as any)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">{t("emailDigest.never")}</SelectItem>
                <SelectItem value="daily">{t("emailDigest.daily")}</SelectItem>
                <SelectItem value="weekly">
                  {t("emailDigest.weekly")}
                </SelectItem>
                <SelectItem value="monthly">
                  {t("emailDigest.monthly")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Granular Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <Bell className="size-4 text-muted-foreground" />
            <CardTitle>{t("notifications.title")}</CardTitle>
          </div>
          <CardDescription>{t("notifications.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(["email", "push", "in_app"] as const).map((channel) => (
            <div key={channel} className="space-y-4">
              <h4 className="text-sm font-semibold capitalize">
                {t(`notifications.channels.${channel}`)}
              </h4>
              <div className="pl-4 space-y-3">
                {(
                  [
                    "system",
                    "billing",
                    "security",
                    "support",
                    "marketing",
                    "newsletter",
                    "customer",
                    "document",
                    "subscription",
                    "invoice",
                    "payment",
                  ] as const
                ).map((type) => (
                  <div key={type} className="flex justify-between items-center">
                    <Label
                      htmlFor={`${channel}-${type}`}
                      className="capitalize"
                    >
                      {t(`notifications.types.${type}`, { defaultValue: type })}
                    </Label>
                    <Switch
                      checked={
                        watchedPreferences.notification_preferences_granular[
                          channel
                        ][type] ?? true
                      }
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
          {isPending && <Loader2 className="mr-2 animate-spin size-4" />}
          {t("saveButton")}
        </Button>
      </div>
    </form>
  );
}
