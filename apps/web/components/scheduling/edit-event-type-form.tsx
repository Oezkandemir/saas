"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  updateEventType,
  type EventType,
} from "@/actions/scheduling/event-types-actions";
import { Button } from '@/components/alignui/actions/button';
import {
  FormRoot as Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/alignui/forms/form";
import { Input } from '@/components/alignui/forms/input';
import { TextareaRoot as Textarea } from "@/components/alignui/forms/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Settings, Code, Copy, Check } from "lucide-react";
import { getURL } from "@/lib/utils";
import { useLocale } from "next-intl";

const eventTypeSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  duration_minutes: z.number().int().min(5).max(480).default(30),
  location_type: z.enum(["google_meet", "zoom", "custom_link", "phone", "in_person"]).default("google_meet"),
  location_value: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  price_amount: z.number().min(0).optional(),
  price_currency: z.string().max(3).default("EUR").optional(),
});

type EventTypeFormValues = z.infer<typeof eventTypeSchema>;

interface EditEventTypeFormProps {
  eventType: EventType;
  userId: string;
  onSuccess?: () => void;
}

export function EditEventTypeForm({ eventType, userId, onSuccess }: EditEventTypeFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Scheduling.eventTypes.form");
  const [isLoading, setIsLoading] = useState(false);
  const [embedType, setEmbedType] = useState<"button" | "script" | "link">("button");
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Use userId prop or fallback to eventType.owner_user_id
  const ownerUserId = userId || eventType.owner_user_id;

  // Function to generate embed code based on type
  const getEmbedCode = (userId: string, slug: string, locale: string, type: "button" | "script" | "link"): string => {
    const baseUrl = getURL();
    const bookingUrl = `${baseUrl}/${locale}/book/${userId}/${slug}`;
    
    switch (type) {
      case "button":
        // Simple HTML button with link
        const buttonText = t("bookButton") || "Termin buchen";
        return `<a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; transition: background-color 0.2s;">
  ${buttonText}
</a>`;
      
      case "script":
        // JavaScript widget that opens a modal/popup
        const widgetButtonText = t("bookButton") || "Termin buchen";
        return `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/booking.js';
    script.setAttribute('data-user-id', '${userId}');
    script.setAttribute('data-event-slug', '${slug}');
    script.setAttribute('data-locale', '${locale}');
    script.setAttribute('data-button-text', '${widgetButtonText}');
    script.setAttribute('data-container-id', 'booking-widget-${slug}');
    document.head.appendChild(script);
  })();
</script>
<div id="booking-widget-${slug}"></div>`;
      
      case "link":
        // Simple direct link
        const linkText = t("bookLink") || "Termin buchen";
        return `<a href="${bookingUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      
      default:
        return "";
    }
  };

  const form = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeSchema),
    mode: "onBlur",
    defaultValues: {
      slug: eventType.slug,
      title: eventType.title,
      description: eventType.description || "",
      duration_minutes: eventType.duration_minutes,
      location_type: eventType.location_type,
      location_value: eventType.location_value || "",
      is_active: eventType.is_active,
      price_amount: eventType.price_amount || undefined,
      price_currency: eventType.price_currency || "EUR",
    },
  });

  const onSubmit = async (data: EventTypeFormValues) => {
    setIsLoading(true);
    try {
      const result = await updateEventType({
        id: eventType.id,
        ...data,
      });
      
      if (!result.success) {
        toast.error(t("updateError") || "Failed to update event type", {
          description: result.error,
        });
        return;
      }

      toast.success(t("updateSuccess") || "Event type updated", {
        description: t("updateSuccessDescription") || "Your event type has been updated successfully",
      });
      
      router.refresh();
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : t("unexpectedError") || "An unexpected error occurred";
      
      toast.error(t("updateError") || "Failed to update event type", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("basicInfo") || "Basic Information"}
            </CardTitle>
            <CardDescription>
              {t("basicInfoDescription") || "Set up the basic details for your event type"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title") || "Title"}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("titlePlaceholder") || "e.g., 30-Minute Meeting"} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("titleDescription") || "A descriptive name for this event type"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("slug") || "URL Slug"}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("slugPlaceholder") || "e.g., 30-minute-meeting"} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("slugDescription") || "Used in the booking URL. Only lowercase letters, numbers, and hyphens."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description") || "Description"}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("descriptionPlaceholder") || "Optional description for this event type"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Duration & Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("duration") || "Duration"}
            </CardTitle>
            <CardDescription>
              {t("durationDescription") || "Configure the duration of the event"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("durationMinutes") || "Duration (minutes)"}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={5} 
                      max={480} 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("durationDescription") || "How long is this event? (5-480 minutes)"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("location") || "Location"}
            </CardTitle>
            <CardDescription>
              {t("locationDescription") || "Where will this event take place?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="location_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("locationType") || "Location Type"}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectLocationType") || "Select location type"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="google_meet">Google Meet</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="custom_link">Custom Link</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("locationValue") || "Location Details"}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t("locationValuePlaceholder") || "URL, address, or phone number"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {t("locationValueDescription") || "Optional: Meeting link, address, or phone number"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Active Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("status") || "Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("isActive") || "Active"}
                    </FormLabel>
                    <FormDescription>
                      {t("isActiveDescription") || "Inactive event types won't appear on booking pages"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("pricing") || "Pricing"}
            </CardTitle>
            <CardDescription>
              {t("pricingDescription") || "Set a price per person for this event type (optional)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pricePerPerson") || "Price per Person"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min={0}
                        placeholder={t("pricePlaceholder") || "0.00"} 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("priceDescription") || "Price per person (will be multiplied by number of participants)"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("currency") || "Currency"}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "EUR"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCurrency") || "Select currency"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Embed Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              {t("embed") || "Einbettungscode"}
            </CardTitle>
            <CardDescription>
              {t("embedDescription") || "Betten Sie diesen Event Type auf Ihrer Website ein - ohne iframe-Probleme"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Embed Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("embedType") || "Einbettungstyp"}</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={embedType === "button" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setEmbedType("button")}
                >
                  {t("buttonWidget") || "Button Widget"}
                </Button>
                <Button
                  type="button"
                  variant={embedType === "script" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setEmbedType("script")}
                >
                  {t("scriptWidget") || "JavaScript Widget"}
                </Button>
                <Button
                  type="button"
                  variant={embedType === "link" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setEmbedType("link")}
                >
                  {t("directLink") || "Direkter Link"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {embedType === "button" && (t("buttonWidgetDescription") || "Einfacher HTML-Button mit Link")}
                {embedType === "script" && (t("scriptWidgetDescription") || "JavaScript Widget öffnet Modal/Popup")}
                {embedType === "link" && (t("directLinkDescription") || "Einfacher Link zur Buchungsseite")}
              </p>
            </div>

            {/* Embed Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("embedCode") || "Einbettungscode"}</label>
              <div className="relative">
                <textarea
                  readOnly
                  value={getEmbedCode(ownerUserId, eventType.slug, locale, embedType)}
                  className="w-full min-h-[120px] p-3 pr-10 font-mono text-sm bg-muted rounded-md border resize-none"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={async () => {
                    const embedCode = getEmbedCode(ownerUserId, eventType.slug, locale, embedType);
                    try {
                      await navigator.clipboard.writeText(embedCode);
                      setCopiedEmbed(true);
                      toast.success(t("embedCopied") || "Einbettungscode kopiert");
                      setTimeout(() => setCopiedEmbed(false), 2000);
                    } catch (error) {
                      toast.error(t("embedCopyError") || "Fehler beim Kopieren");
                    }
                  }}
                >
                  {copiedEmbed ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t("copied") || "Kopiert"}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t("copy") || "Kopieren"}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("embedInstructions") || "Kopieren Sie diesen Code und fügen Sie ihn in das HTML Ihrer Website ein"}
              </p>
            </div>

            {/* Preview */}
            {embedType === "button" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("preview") || "Vorschau"}</label>
                <div className="border rounded-md p-4 bg-muted/50 flex items-center justify-center">
                  <a 
                    href={`${getURL()}/${locale}/book/${ownerUserId}/${eventType.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                  >
                    {t("bookButton") || "Termin buchen"}
                  </a>
                </div>
              </div>
            )}
            {embedType === "link" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("preview") || "Vorschau"}</label>
                <div className="border rounded-md p-4 bg-muted/50">
                  <a 
                    href={`${getURL()}/${locale}/book/${ownerUserId}/${eventType.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t("bookLink") || "Termin buchen"}
                  </a>
                </div>
              </div>
            )}
            {embedType === "script" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("preview") || "Vorschau"}</label>
                <div className="border rounded-md p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {t("scriptWidgetPreview") || "Das JavaScript Widget wird einen Button rendern, der beim Klick ein Modal mit der Buchungsseite öffnet."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            {t("cancel") || "Cancel"}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2">{t("updating") || "Updating..."}</span>
              </>
            ) : (
              t("update") || "Update Event Type"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

