"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from '@/components/alignui/actions/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Clock, Trash2, Edit, Users } from "lucide-react";
import { toast } from "sonner";
import {
  getTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  type TimeSlot,
} from "@/actions/scheduling/time-slots-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const timeSlotSchema = z.object({
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Format: HH:MM"),
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Format: HH:MM"),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  max_participants: z.number().int().min(1).optional(),
});

type TimeSlotFormValues = z.infer<typeof timeSlotSchema>;

interface TimeSlotsManagerProps {
  eventTypeId: string;
  defaultMaxParticipants?: number | null;
}

const dayNames = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

export function TimeSlotsManager({ eventTypeId, defaultMaxParticipants = 12 }: TimeSlotsManagerProps) {
  const t = useTranslations("Scheduling.timeSlots");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TimeSlotFormValues>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      start_time: "",
      end_time: "",
      day_of_week: null,
      max_participants: undefined,
    },
  });

  const loadSlots = async () => {
    setIsLoading(true);
    try {
      const result = await getTimeSlots(eventTypeId);
      if (result.success && result.data) {
        setSlots(result.data);
      }
    } catch (error) {
      toast.error(t("loadError") || "Fehler beim Laden der Zeitslots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [eventTypeId]);

  const handleOpenDialog = (slot?: TimeSlot) => {
    if (slot) {
      setEditingSlot(slot);
      form.reset({
        start_time: slot.start_time.substring(0, 5), // Remove seconds
        end_time: slot.end_time.substring(0, 5),
        day_of_week: slot.day_of_week,
        max_participants: slot.max_participants || undefined,
      });
    } else {
      setEditingSlot(null);
      form.reset({
        start_time: "",
        end_time: "",
        day_of_week: null,
        max_participants: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSlot(null);
    form.reset();
  };

  const onSubmit = async (data: TimeSlotFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert HH:MM to HH:MM:SS
      const startTime = `${data.start_time}:00`;
      const endTime = `${data.end_time}:00`;

      const result = editingSlot
        ? await updateTimeSlot({
            id: editingSlot.id,
            start_time: startTime,
            end_time: endTime,
            day_of_week: data.day_of_week,
            max_participants: data.max_participants,
          })
        : await createTimeSlot({
            event_type_id: eventTypeId,
            start_time: startTime,
            end_time: endTime,
            day_of_week: data.day_of_week,
            max_participants: data.max_participants,
          });

      if (!result.success) {
        toast.error(result.error || t("saveError") || "Fehler beim Speichern");
        return;
      }

      toast.success(
        editingSlot
          ? (t("updated") || "Zeitslot aktualisiert")
          : (t("created") || "Zeitslot erstellt")
      );
      handleCloseDialog();
      loadSlots();
    } catch (error) {
      toast.error(t("saveError") || "Fehler beim Speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSlot) return;

    setIsSubmitting(true);
    try {
      const result = await deleteTimeSlot(deletingSlot.id);
      if (!result.success) {
        toast.error(result.error || t("deleteError") || "Fehler beim Löschen");
        return;
      }

      toast.success(t("deleted") || "Zeitslot gelöscht");
      setDeletingSlot(null);
      loadSlots();
    } catch (error) {
      toast.error(t("deleteError") || "Fehler beim Löschen");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            {t("loading") || "Lädt..."}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("title") || "Zeitslots"}</CardTitle>
              <CardDescription>
                {t("description") || "Verwalten Sie feste Zeitslots für diesen Event Type"}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("addSlot") || "Zeitslot hinzufügen"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSlot
                      ? (t("form.update") || "Zeitslot bearbeiten")
                      : (t("form.create") || "Neuer Zeitslot")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("form.description") || "Geben Sie Start- und Endzeit an (z.B. 13:30 - 15:00)"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form.startTime") || "Startzeit"}</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                placeholder="13:30"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form.endTime") || "Endzeit"}</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                placeholder="15:00"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="day_of_week"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.dayOfWeek") || "Wochentag"}</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(value === "all" ? null : parseInt(value))
                            }
                            value={field.value === null ? "all" : field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("form.dayOfWeekDescription") || "Alle Tage"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">{t("dayOfWeek.all") || "Alle Tage"}</SelectItem>
                              {dayNames.map((day, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t("form.dayOfWeekDescription") || "Leer lassen für alle Tage"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_participants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.maxParticipants") || "Max. Teilnehmer"}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder={defaultMaxParticipants?.toString() || "12"}
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("form.maxParticipantsDescription") ||
                              `Standard: ${defaultMaxParticipants || 12} Teilnehmer`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        disabled={isSubmitting}
                      >
                        {t("form.cancel") || "Abbrechen"}
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? (t("saving") || "Speichern...")
                          : editingSlot
                          ? (t("form.update") || "Aktualisieren")
                          : (t("form.create") || "Erstellen")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t("noSlots") || "Keine Zeitslots konfiguriert. Buchungen können zu jeder Zeit vorgenommen werden."}
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                        </span>
                        {slot.day_of_week !== null && (
                          <Badge variant="outline" className="text-xs">
                            {dayNames[slot.day_of_week]}
                          </Badge>
                        )}
                        {slot.day_of_week === null && (
                          <Badge variant="outline" className="text-xs">
                            {t("dayOfWeek.all") || "Alle Tage"}
                          </Badge>
                        )}
                      </div>
                      {slot.max_participants && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>
                            {slot.max_participants} {t("form.maxParticipants") || "Teilnehmer"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(slot)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingSlot(slot)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingSlot} onOpenChange={(open) => !open && setDeletingSlot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle") || "Zeitslot löschen?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription") ||
                "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("form.cancel") || "Abbrechen"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("form.delete") || "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}






