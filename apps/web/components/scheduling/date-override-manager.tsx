"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar, Clock, Edit, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  type AvailabilityOverride,
  createAvailabilityOverride,
  deleteAvailabilityOverride,
  getAvailabilityOverrides,
  updateAvailabilityOverride,
} from "@/actions/scheduling/availability-actions";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const dateOverrideSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
    is_unavailable: z.boolean().default(false),
    start_time: z
      .string()
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .optional()
      .or(z.literal("")),
    end_time: z
      .string()
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // If both times are provided, start must be before end
      if (
        data.start_time &&
        data.end_time &&
        data.start_time >= data.end_time
      ) {
        return false;
      }
      // If one time is provided, both must be provided
      if (
        (data.start_time && !data.end_time) ||
        (!data.start_time && data.end_time)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Start time must be before end time, and both times must be provided together",
    }
  );

type DateOverrideFormValues = z.infer<typeof dateOverrideSchema>;

interface DateOverrideManagerProps {
  eventTypeId: string;
}

export function DateOverrideManager({ eventTypeId }: DateOverrideManagerProps) {
  const locale = useLocale();
  const dateLocale = locale === "de" ? de : enUS;
  const t = useTranslations("Scheduling.dateOverrides");
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] =
    useState<AvailabilityOverride | null>(null);
  const [deletingOverride, setDeletingOverride] =
    useState<AvailabilityOverride | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DateOverrideFormValues>({
    resolver: zodResolver(dateOverrideSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      is_unavailable: false,
      start_time: "",
      end_time: "",
    },
  });

  const loadOverrides = async () => {
    setIsLoading(true);
    try {
      const result = await getAvailabilityOverrides(eventTypeId);
      if (result.success && result.data) {
        setOverrides(result.data);
      }
    } catch (_error) {
      toast.error(
        t("loadError") || "Fehler beim Laden der Datumsüberschreibungen"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverrides();
  }, [loadOverrides]);

  const handleOpenDialog = (override?: AvailabilityOverride) => {
    if (override) {
      setEditingOverride(override);
      form.reset({
        date: override.date,
        is_unavailable: override.is_unavailable,
        start_time: override.start_time?.substring(0, 5) || "",
        end_time: override.end_time?.substring(0, 5) || "",
      });
    } else {
      setEditingOverride(null);
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        is_unavailable: false,
        start_time: "",
        end_time: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOverride(null);
    form.reset();
  };

  const onSubmit = async (data: DateOverrideFormValues) => {
    setIsSubmitting(true);
    try {
      let result;
      if (editingOverride) {
        // Update existing override
        result = await updateAvailabilityOverride(editingOverride.id, {
          date: data.date,
          is_unavailable: data.is_unavailable,
          start_time: data.start_time || undefined,
          end_time: data.end_time || undefined,
          timezone: "Europe/Berlin",
          event_type_id: eventTypeId,
        });
      } else {
        // Create new override
        result = await createAvailabilityOverride({
          date: data.date,
          is_unavailable: data.is_unavailable,
          start_time: data.start_time || undefined,
          end_time: data.end_time || undefined,
          timezone: "Europe/Berlin",
          event_type_id: eventTypeId,
        });
      }

      if (!result.success) {
        toast.error(result.error || t("saveError") || "Fehler beim Speichern");
        return;
      }

      toast.success(
        editingOverride
          ? t("updated") || "Datumsüberschreibung aktualisiert"
          : t("created") || "Datumsüberschreibung erstellt"
      );
      handleCloseDialog();
      loadOverrides();
    } catch (_error) {
      toast.error(t("saveError") || "Fehler beim Speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOverride) return;

    setIsSubmitting(true);
    try {
      const result = await deleteAvailabilityOverride(deletingOverride.id);
      if (!result.success) {
        toast.error(result.error || t("deleteError") || "Fehler beim Löschen");
        return;
      }

      toast.success(t("deleted") || "Datumsüberschreibung gelöscht");
      setDeletingOverride(null);
      loadOverrides();
    } catch (_error) {
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

  // Sort overrides by date (ascending)
  const sortedOverrides = [...overrides].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("title") || "Datumsüberschreibungen"}
          </CardTitle>
          <CardDescription>
            {t("description") ||
              "Überschreiben Sie die Verfügbarkeit für spezifische Daten"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                size="sm"
                className="gap-2"
              >
                <Plus className="size-4" />
                {t("add") || "Datumsüberschreibung hinzufügen"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingOverride
                    ? t("edit") || "Datumsüberschreibung bearbeiten"
                    : t("add") || "Datumsüberschreibung hinzufügen"}
                </DialogTitle>
                <DialogDescription>
                  {t("form.description") ||
                    "Legen Sie eine Überschreibung für einen spezifischen Tag fest"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.date") || "Datum"}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_unavailable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>
                            {t("form.unavailable") || "Nicht verfügbar"}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("form.unavailableDescription") ||
                              "Wenn aktiviert, ist dieser Tag komplett nicht verfügbar"}
                          </p>
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

                  {!form.watch("is_unavailable") && (
                    <>
                      <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.startTime") || "Startzeit (optional)"}
                            </FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
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
                            <FormLabel>
                              {t("form.endTime") || "Endzeit (optional)"}
                            </FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

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
                        ? t("form.saving") || "Speichern..."
                        : editingOverride
                          ? t("form.update") || "Aktualisieren"
                          : t("form.create") || "Erstellen"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {sortedOverrides.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t("noOverrides") || "Keine Datumsüberschreibungen konfiguriert"}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedOverrides.map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {format(
                            new Date(override.date),
                            "EEEE, d. MMMM yyyy",
                            { locale: dateLocale }
                          )}
                        </span>
                        <Badge
                          variant={
                            override.is_unavailable ? "destructive" : "default"
                          }
                        >
                          {override.is_unavailable
                            ? t("unavailable") || "Nicht verfügbar"
                            : t("available") || "Verfügbar"}
                        </Badge>
                      </div>
                      {override.start_time && override.end_time && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          <span>
                            {override.start_time.substring(0, 5)} -{" "}
                            {override.end_time.substring(0, 5)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(override)}
                      disabled={isSubmitting}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingOverride(override)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deletingOverride}
        onOpenChange={(open) => !open && setDeletingOverride(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteConfirmTitle") || "Datumsüberschreibung löschen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription") ||
                "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t("form.cancel") || "Abbrechen"}
            </AlertDialogCancel>
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
