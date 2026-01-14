"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createEventType } from "@/actions/scheduling/event-types-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, MapPin } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

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

interface CreateEventTypeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEventTypeDrawer({
  open,
  onOpenChange,
}: CreateEventTypeDrawerProps) {
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

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      form.reset({
        slug: "",
        title: "",
        description: "",
        duration_minutes: 30,
        location_type: "google_meet",
        location_value: "",
        is_active: true,
        price_amount: undefined,
        price_currency: "EUR",
      });
    }
  }, [open, form]);

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

      onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{t("createNew") || "Create New Event Type"}</SheetTitle>
          <SheetDescription>
            {t("createDescription") || "Create a new event type for scheduling"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 flex flex-col">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
              <Accordion type="multiple" defaultValue={["basic", "duration"]} className="w-full">
                {/* Basic Information */}
                <AccordionItem value="basic" className="border-b border-stroke-soft-200">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("form.basicInfo") || "Grundinformationen"}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-1">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form.title") || "Titel"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  t("form.titlePlaceholder") ||
                                  "z.B., 30-Minuten-Meeting"
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t("form.titleDescription") ||
                                "Ein beschreibender Name für diesen Event Type"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form.slug") || "URL Slug"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  t("form.slugPlaceholder") ||
                                  "z.B., 30-minute-meeting"
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t("form.slugDescription") ||
                                "Wird in der Buchungs-URL verwendet. Nur Kleinbuchstaben, Zahlen und Bindestriche."}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.description") || "Beschreibung"}
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={
                                  t("form.descriptionPlaceholder") ||
                                  "Optionale Beschreibung für diesen Event Type"
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Duration */}
                <AccordionItem value="duration">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("form.duration") || "Dauer"}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-1">
                      <FormField
                        control={form.control}
                        name="duration_minutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.durationMinutes") || "Dauer (Minuten)"}
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
                                "Wie lange dauert dieses Event? (5-480 Minuten)"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Location */}
                <AccordionItem value="location">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("form.location") || "Ort"}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-1">
                      <FormField
                        control={form.control}
                        name="location_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.locationType") || "Ortstyp"}
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
                                      "Ortstyp auswählen"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="google_meet">
                                  Google Meet
                                </SelectItem>
                                <SelectItem value="zoom">Zoom</SelectItem>
                                <SelectItem value="custom_link">
                                  Custom Link
                                </SelectItem>
                                <SelectItem value="phone">Phone Call</SelectItem>
                                <SelectItem value="in_person">In Person</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <FormField
                        control={form.control}
                        name="location_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.locationValue") || "Ortsdetails"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  t("form.locationValuePlaceholder") ||
                                  "URL, Adresse oder Telefonnummer"
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t("form.locationValueDescription") ||
                                "Optional: Meeting-Link, Adresse oder Telefonnummer"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Active Status */}
                <AccordionItem value="status">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Status
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-1">
                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t("form.isActive") || "Aktiv"}
                              </FormLabel>
                              <FormDescription>
                                {t("form.isActiveDescription") ||
                                  "Inaktive Event Types erscheinen nicht auf Buchungsseiten"}
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
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Pricing */}
                <AccordionItem value="pricing">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("form.pricing") || "Preis"}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("form.pricePerPerson") || "Preis pro Person"}
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
                                  "Preis pro Person (wird mit der Anzahl der Teilnehmer multipliziert)"}
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
                              <FormLabel>
                                {t("form.currency") || "Währung"}
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || "EUR"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        t("form.selectCurrency") || "Währung auswählen"
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Actions - Immer ganz unten, außerhalb der Accordions */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-1 gap-1.5">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    size="sm"
                    className="gap-1.5 w-full bg-bg-white-0 dark:bg-bg-white-0 text-text-strong-950 dark:text-text-strong-950 border-stroke-soft-200 hover:bg-bg-white-50 dark:hover:bg-bg-white-50"
                  >
                    <span className="text-xs">
                      {isLoading
                        ? t("form.creating") || "Wird erstellt..."
                        : t("form.create") || "Event Type erstellen"}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                    size="sm"
                    className="gap-1.5 w-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    <span className="text-xs">{t("form.cancel") || "Abbrechen"}</span>
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
