"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEventType } from "@/actions/scheduling/event-types-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, MapPin, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/alignui/actions/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import {
  FormRoot as Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/alignui/forms/form";
import { Input } from "@/components/alignui/forms/input";
import { TextareaRoot as Textarea } from "@/components/alignui/forms/textarea";

const eventTypeSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  duration_minutes: z.number().int().min(5).max(480).default(30),
  location_type: z
    .enum(["google_meet", "zoom", "custom_link", "phone", "in_person"])
    .default("google_meet"),
  location_value: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  price_amount: z.number().min(0).optional(),
  price_currency: z.string().max(3).default("EUR").optional(),
});

type EventTypeFormValues = z.infer<typeof eventTypeSchema>;

export function CreateEventTypeForm() {
  const router = useRouter();
  const t = useTranslations("Scheduling.eventTypes");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeSchema),
    mode: "onBlur",
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      duration_minutes: 30,
      location_type: "google_meet",
      location_value: "",
      is_active: true,
      price_amount: undefined,
      price_currency: "EUR",
    },
  });

  const onSubmit = async (data: EventTypeFormValues) => {
    setIsLoading(true);
    try {
      const result = await createEventType(data);

      if (!result.success) {
        toast.error(t("createError") || "Failed to create event type", {
          description: result.error,
        });
        return;
      }

      toast.success(t("createSuccess") || "Event type created", {
        description:
          t("createSuccessDescription") ||
          "Your event type has been created successfully",
      });

      router.push("/dashboard/scheduling");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("unexpectedError") || "An unexpected error occurred";

      toast.error(t("createError") || "Failed to create event type", {
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
              {t("form.basicInfo") || "Basic Information"}
            </CardTitle>
            <CardDescription>
              {t("form.basicInfoDescription") ||
                "Set up the basic details for your event type"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.title") || "Title"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("form.titlePlaceholder") || "e.g., 30-Minute Meeting"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.titleDescription") ||
                      "A descriptive name for this event type"}
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
                  <FormLabel>{t("form.slug") || "URL Slug"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("form.slugPlaceholder") || "e.g., 30-minute-meeting"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.slugDescription") ||
                      "Used in the booking URL. Only lowercase letters, numbers, and hyphens."}
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
                  <FormLabel>
                    {t("form.description") || "Description"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        t("form.descriptionPlaceholder") ||
                        "Optional description for this event type"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("form.duration") || "Duration"}
            </CardTitle>
            <CardDescription>
              {t("form.durationDescription") ||
                "Configure the duration of the event"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.durationMinutes") || "Duration (minutes)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={480}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 30)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.durationDescription") ||
                      "How long is this event? (5-480 minutes)"}
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
              {t("form.location") || "Location"}
            </CardTitle>
            <CardDescription>
              {t("form.locationDescription") ||
                "Where will this event take place?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="location_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.locationType") || "Location Type"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            t("form.selectLocationType") ||
                            "Select location type"
                          }
                        />
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
                  <FormLabel>
                    {t("form.locationValue") || "Location Details"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("form.locationValuePlaceholder") ||
                        "URL, address, or phone number"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.locationValueDescription") ||
                      "Optional: Meeting link, address, or phone number"}
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
              {t("form.status") || "Status"}
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
                      {t("form.isActive") || "Active"}
                    </FormLabel>
                    <FormDescription>
                      {t("form.isActiveDescription") ||
                        "Inactive event types won't appear on booking pages"}
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
              {t("form.pricing") || "Pricing"}
            </CardTitle>
            <CardDescription>
              {t("form.pricingDescription") ||
                "Set a price per person for this event type (optional)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("form.pricePerPerson") || "Price per Person"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder={t("form.pricePlaceholder") || "0.00"}
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.priceDescription") ||
                        "Price per person (will be multiplied by number of participants)"}
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
                    <FormLabel>{t("form.currency") || "Currency"}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "EUR"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              t("form.selectCurrency") || "Select currency"
                            }
                          />
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

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            {t("form.cancel") || "Cancel"}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2">
                  {t("form.creating") || "Creating..."}
                </span>
              </>
            ) : (
              t("form.create") || "Create Event Type"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
