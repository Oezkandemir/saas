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
} from "@/components/alignui/forms/form";
import { Input } from '@/components/alignui/forms/input';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Clock, Trash2, Edit, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  getWeeklyAvailability,
  upsertWeeklyAvailability,
  deleteWeeklyAvailability,
  type AvailabilityRule,
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

const availabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Format: HH:MM"),
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Format: HH:MM"),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

const dayNames = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

interface AvailabilityManagerProps {
  eventTypeId?: string;
}

export function AvailabilityManager({ eventTypeId }: AvailabilityManagerProps = {}) {
  const t = useTranslations("Scheduling.availability");
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<AvailabilityRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      day_of_week: 1,
      start_time: "09:00",
      end_time: "17:00",
    },
  });

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const result = await getWeeklyAvailability(eventTypeId);
      if (result.success && result.data) {
        setRules(result.data);
      }
    } catch (error) {
      toast.error(t("loadError") || "Fehler beim Laden der Öffnungszeiten");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [eventTypeId]);

  const handleOpenDialog = (rule?: AvailabilityRule) => {
    if (rule) {
      setEditingRule(rule);
      form.reset({
        day_of_week: rule.day_of_week,
        start_time: rule.start_time.substring(0, 5),
        end_time: rule.end_time.substring(0, 5),
      });
    } else {
      setEditingRule(null);
      form.reset({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
    form.reset();
  };

  const onSubmit = async (data: AvailabilityFormValues) => {
    setIsSubmitting(true);
    try {
      const startTime = `${data.start_time}:00`;
      const endTime = `${data.end_time}:00`;

      const result = await upsertWeeklyAvailability({
        day_of_week: data.day_of_week,
        start_time: startTime,
        end_time: endTime,
        timezone: "Europe/Berlin",
        event_type_id: eventTypeId,
      });

      if (!result.success) {
        toast.error(result.error || t("saveError") || "Fehler beim Speichern");
        return;
      }

      toast.success(
        editingRule
          ? (t("updated") || "Öffnungszeit aktualisiert")
          : (t("created") || "Öffnungszeit erstellt")
      );
      handleCloseDialog();
      loadRules();
    } catch (error) {
      toast.error(t("saveError") || "Fehler beim Speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;

    setIsSubmitting(true);
    try {
      const result = await deleteWeeklyAvailability(deletingRule.id);
      if (!result.success) {
        toast.error(result.error || t("deleteError") || "Fehler beim Löschen");
        return;
      }

      toast.success(t("deleted") || "Öffnungszeit gelöscht");
      setDeletingRule(null);
      loadRules();
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

  // Group rules by day
  const rulesByDay = rules.reduce((acc, rule) => {
    if (!acc[rule.day_of_week]) {
      acc[rule.day_of_week] = [];
    }
    acc[rule.day_of_week].push(rule);
    return acc;
  }, {} as Record<number, AvailabilityRule[]>);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("title") || "Öffnungszeiten"}
              </CardTitle>
              <CardDescription>
                {t("description") || "Legen Sie Ihre wöchentlichen Öffnungszeiten fest"}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("add") || "Öffnungszeit hinzufügen"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRule
                      ? (t("edit") || "Öffnungszeit bearbeiten")
                      : (t("add") || "Neue Öffnungszeit")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("formDescription") || "Geben Sie die Öffnungszeiten für einen Wochentag an"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="day_of_week"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("dayOfWeek") || "Wochentag"}</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {dayNames.map((day, index) => (
                                <option key={index} value={index}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("startTime") || "Startzeit"}</FormLabel>
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
                            <FormLabel>{t("endTime") || "Endzeit"}</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        disabled={isSubmitting}
                      >
                        {t("cancel") || "Abbrechen"}
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? (t("saving") || "Speichern...")
                          : editingRule
                          ? (t("update") || "Aktualisieren")
                          : (t("create") || "Erstellen")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t("noRules") || "Keine Öffnungszeiten konfiguriert. Alle Zeiten sind verfügbar."}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(rulesByDay)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([day, dayRules]) => (
                  <div key={day} className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      {dayNames[parseInt(day)]}
                    </div>
                    {dayRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {rule.start_time.substring(0, 5)} - {rule.end_time.substring(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(rule)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingRule(rule)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle") || "Öffnungszeit löschen?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription") ||
                "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel") || "Abbrechen"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete") || "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

