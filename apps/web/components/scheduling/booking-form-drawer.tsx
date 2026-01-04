"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createBooking, type AvailableSlot } from "@/actions/scheduling/bookings-actions";
import type { EventType } from "@/actions/scheduling/event-types-actions";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { User, Mail, MessageSquare, Users, Plus, Minus, Euro, DollarSign, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

const bookingSchema = z.object({
  invitee_name: z.string().min(1, "Name is required").max(200),
  invitee_email: z.string().email("Invalid email address"),
  invitee_notes: z.string().max(1000).optional(),
  start_at: z.string().datetime(),
  number_of_participants: z.number().int().min(1).default(1),
  participant_names: z.array(z.string().min(1, "Name is required").max(200)).optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormDrawerProps {
  eventType: EventType & { 
    owner: { name: string | null; email: string | null };
    price_type?: 'hourly' | 'fixed';
  };
  selectedSlot: AvailableSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingFormDrawer({ 
  eventType, 
  selectedSlot, 
  open, 
  onOpenChange 
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
    control: form.control,
    name: "participant_names",
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

  const getCurrencyIcon = (currency: string | null) => {
    const curr = (currency || 'EUR').toUpperCase();
    if (curr === 'USD') return DollarSign;
    if (curr === 'EUR') return Euro;
    return CreditCard;
  };

  const CurrencyIcon = eventType.price_currency ? getCurrencyIcon(eventType.price_currency) : Euro;

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

      // Show success toast
      toast.success(t("bookingSuccess") || "Booking confirmed!", {
        description: t("bookingSuccessDescription") || "Your booking has been confirmed. Check your email for details.",
      });

      // Close drawer
      onOpenChange(false);

      // Redirect to scheduling dashboard after a short delay
      setTimeout(() => {
        router.push(`/${locale}/dashboard/scheduling`);
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error 
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
          <SheetTitle>{t("yourDetails") || "Your Details"}</SheetTitle>
          <SheetDescription>
            {t("yourDetailsDescription") || "Please provide your information to complete the booking"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Selected Slot Info */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="text-sm font-semibold mb-2">
              {t("selectedSlot") || "Selected Slot"}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(slotStart, "EEEE, d. MMMM yyyy 'um' HH:mm", { locale: dateLocale })}
            </div>
            {totalPrice !== null && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("totalPrice") || "Total Price"}:
                </span>
                <span className="text-lg font-bold text-primary">
                  {totalPrice.toFixed(2)} {eventType.price_currency || 'EUR'}
                </span>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="invitee_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t("name") || "Name"}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t("namePlaceholder") || "Your name"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invitee_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t("email") || "Email"}
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t("emailPlaceholder") || "your@email.com"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number_of_participants"
                render={({ field }) => {
                  const maxParticipants = selectedSlot?.max_participants || 999;
                  const availablePlaces = selectedSlot?.available_places ?? maxParticipants;
                  const currentValue = field.value || 1;
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t("numberOfParticipants") || "Number of Participants"}
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
                        {selectedSlot?.max_participants && selectedSlot.available_places !== undefined && (
                          <span className="text-sm text-muted-foreground">
                            {t("availablePlaces", { places: selectedSlot.available_places }) || `${selectedSlot.available_places} places available`}
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Dynamic participant name fields */}
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`participant_names.${index}`}
                  render={({ field: nameField }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t("participantName", { number: index + 2 }) || `Teilnehmer ${index + 2}`}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t("participantNamePlaceholder", { number: index + 2 }) || `Name des Teilnehmers ${index + 2}`} 
                          {...nameField} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <FormField
                control={form.control}
                name="invitee_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t("notes") || "Notes (Optional)"}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("notesPlaceholder") || "Any additional information..."} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting 
                    ? (t("booking") || "Booking...")
                    : (t("confirmBooking") || "Confirm Booking")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

