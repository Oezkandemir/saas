"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBooking,
  type AvailableSlot,
} from "@/actions/scheduling/bookings-actions";
import type { EventType } from "@/actions/scheduling/event-types-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Mail, MessageSquare, Minus, Plus, User, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useFieldArray,
  useForm,
  type Control,
  type FieldArrayPath,
} from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

const bookingSchema = z.object({
  invitee_name: z.string().min(1, "Name is required").max(200),
  invitee_email: z.string().email("Invalid email address"),
  invitee_notes: z.string().max(1000).optional(),
  start_at: z.string().datetime(),
  number_of_participants: z.number().int().min(1).default(1),
  participant_names: z
    .array(z.string().min(1, "Name is required").max(200))
    .default([]),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormDrawerProps {
  eventType: EventType & {
    owner: { name: string | null; email: string | null };
    price_type?: "hourly" | "fixed";
  };
  selectedSlot: AvailableSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingFormDrawer({
  eventType,
  selectedSlot,
  open,
  onOpenChange,
}: BookingFormDrawerProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Scheduling.booking");
  const dateLocale = locale === "de" ? de : enUS;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    mode: "onBlur",
    defaultValues: {
      invitee_name: "",
      invitee_email: "",
      invitee_notes: "",
      start_at: "",
      number_of_participants: 1,
      participant_names: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control as Control<BookingFormValues>,
    name: "participant_names" as FieldArrayPath<BookingFormValues>,
  });

  // Watch number_of_participants to sync participant_names array
  const numberOfParticipants = form.watch("number_of_participants") || 1;

  // Reset form when drawer opens/closes or slot changes
  useEffect(() => {
    if (open && selectedSlot) {
      form.setValue("start_at", selectedSlot.start);
      form.reset({
        invitee_name: "",
        invitee_email: "",
        invitee_notes: "",
        start_at: selectedSlot.start,
        number_of_participants: 1,
        participant_names: [],
      });
    }
  }, [open, selectedSlot, form]);

  useEffect(() => {
    const neededFields = Math.max(0, numberOfParticipants - 1);
    const currentValues = form.getValues("participant_names") || [];
    const newFields = Array(neededFields)
      .fill("")
      .map((_, index) => currentValues[index] || "");
    replace(newFields);
  }, [numberOfParticipants, replace, form]);

  // Calculate price display - always per person, regardless of duration
  const calculatePrice = (participants: number) => {
    if (!eventType.price_amount) return null;
    // Price is always per person (not per hour)
    return eventType.price_amount * participants;
  };

  const onSubmit = async (data: BookingFormValues) => {
    if (!selectedSlot) {
      toast.error(t("selectSlot") || "Please select a time slot");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBooking({
        event_type_id: eventType.id,
        invitee_name: data.invitee_name,
        invitee_email: data.invitee_email,
        invitee_notes: data.invitee_notes,
        start_at: selectedSlot.start,
        time_slot_id: selectedSlot.time_slot_id,
        number_of_participants: data.number_of_participants || 1,
        participant_names: data.participant_names || [],
      });

      if (!result.success) {
        toast.error(t("bookingError") || "Failed to create booking", {
          description: result.error,
        });
        return;
      }

      // Check if email was sent
      const bookingData = result.data as any;
      const emailSent = bookingData?.emailSent !== false; // Default to true if not specified
      const emailError = bookingData?.emailError;

      // Show success toast
      if (emailSent) {
        toast.success(t("bookingSuccess") || "Booking confirmed!", {
          description:
            t("bookingSuccessDescription") ||
            "Your booking has been confirmed. Check your email for details.",
        });
      } else {
        // Booking succeeded but email failed
        toast.success(t("bookingSuccess") || "Booking confirmed!", {
          description:
            t("bookingSuccessDescription") ||
            "Your booking has been confirmed.",
        });
        toast.warning(t("emailCouldNotBeSent"), {
          description:
            emailError ||
            t("emailCouldNotBeSentDescription"),
        });
      }

      // Close drawer
      onOpenChange(false);

      // Redirect to scheduling dashboard after a short delay
      setTimeout(() => {
        router.push(`/${locale}/dashboard/scheduling`);
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("unexpectedError") || "An unexpected error occurred";

      toast.error(t("bookingError") || "Failed to create booking", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedSlot) {
    return null;
  }

  const slotStart = new Date(selectedSlot.start);
  const totalPrice = calculatePrice(numberOfParticipants);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("yourDetails") || "Ihre Details"}</SheetTitle>
          <SheetDescription>
            {t("yourDetailsDescription") ||
              "Bitte geben Sie Ihre Informationen ein, um die Buchung abzuschließen"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 flex flex-col">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
              <Accordion type="multiple" defaultValue={["slot", "contact"]} className="w-full">
                {/* Selected Slot Info - Wichtigste Info zuerst */}
                <AccordionItem value="slot" className="border-b border-stroke-soft-200">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("selectedSlot") || "Ausgewählter Slot"}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CalendarIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {t("dateAndTime")}
                          </span>
                        </p>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {format(slotStart, "EEEE, d. MMMM yyyy 'um' HH:mm", {
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                      {totalPrice !== null && (
                        <>
                          <Separator />
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              {t("totalPrice") || "Gesamtpreis"}
                            </p>
                            <p className="text-lg font-bold text-primary">
                              {totalPrice.toFixed(2)} {eventType.price_currency || "EUR"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Contact Information */}
                <AccordionItem value="contact">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("contactInformation")}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-1">
                      <FormField
                        control={form.control}
                        name="invitee_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              {t("name") || "Name"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("namePlaceholder") || "Ihr Name"}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <FormField
                        control={form.control}
                        name="invitee_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5" />
                              {t("email") || "E-Mail"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={t("emailPlaceholder") || "ihre@email.com"}
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

                {/* Participants */}
                <AccordionItem value="participants">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("participants")}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-1">
                      <FormField
                        control={form.control}
                        name="number_of_participants"
                        render={({ field }) => {
                          const maxParticipants = selectedSlot?.max_participants || 999;
                          const availablePlaces =
                            selectedSlot?.available_places ?? maxParticipants;
                          const currentValue = field.value || 1;

                          return (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5" />
                                {t("numberOfParticipants") || "Anzahl der Teilnehmer"}
                              </FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => {
                                        if (currentValue > 1) {
                                          field.onChange(currentValue - 1);
                                        }
                                      }}
                                      disabled={currentValue <= 1}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-1 text-center font-semibold text-lg min-w-[3rem]">
                                      {currentValue}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => {
                                        if (currentValue < availablePlaces) {
                                          field.onChange(currentValue + 1);
                                        }
                                      }}
                                      disabled={currentValue >= availablePlaces}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </FormControl>
                              <FormDescription>
                                {selectedSlot?.max_participants &&
                                  selectedSlot.available_places !== undefined && (
                                    <span className="text-sm text-muted-foreground">
                                      {t("availablePlaces", {
                                        places: selectedSlot.available_places,
                                      }) ||
                                        `${selectedSlot.available_places} Plätze verfügbar`}
                                    </span>
                                  )}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {/* Dynamic participant name fields */}
                      {fields.length > 0 && <Separator />}
                      {fields.map((field, index) => (
                        <div key={field.id}>
                          {index > 0 && <Separator />}
                          <FormField
                            control={form.control}
                            name={`participant_names.${index}`}
                            render={({ field: nameField }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5" />
                                  {t("participantName", { number: index + 2 }) ||
                                    `Teilnehmer ${index + 2}`}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={
                                      t("participantNamePlaceholder", {
                                        number: index + 2,
                                      }) || `Name des Teilnehmers ${index + 2}`
                                    }
                                    {...nameField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Notes */}
                <AccordionItem value="notes">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("notes") || "Notizen (Optional)"}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-1">
                      <FormField
                        control={form.control}
                        name="invitee_notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {t("notes") || "Notizen"}
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={
                                  t("notesPlaceholder") ||
                                  "Zusätzliche Informationen..."
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
              </Accordion>

              {/* Actions - Immer ganz unten, außerhalb der Accordions */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-1 gap-1.5">
                  <Button
                    type="submit"
                    variant="outline"
                    className="gap-1.5 w-full bg-bg-white-0 dark:bg-bg-white-0 text-text-strong-950 dark:text-text-strong-950 border-stroke-soft-200 hover:bg-bg-white-50 dark:hover:bg-bg-white-50"
                    disabled={isSubmitting}
                    size="sm"
                  >
                    <span className="text-xs">
                      {isSubmitting
                        ? t("booking") || "Wird gebucht..."
                        : t("confirmBooking") || "Buchung bestätigen"}
                    </span>
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
