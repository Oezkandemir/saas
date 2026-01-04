"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from '@/components/alignui/actions/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { applyTimeSlotsToAllEvents } from "@/actions/scheduling/time-slots-actions";
import { getTimeSlots, type TimeSlot } from "@/actions/scheduling/time-slots-actions";

interface ApplyTimeSlotsToAllProps {
  sourceEventTypeId: string;
}

export function ApplyTimeSlotsToAll({ sourceEventTypeId }: ApplyTimeSlotsToAllProps) {
  const t = useTranslations("Scheduling");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const loadTimeSlots = async () => {
    setIsLoadingSlots(true);
    try {
      const result = await getTimeSlots(sourceEventTypeId);
      if (result.success && result.data) {
        setTimeSlots(result.data);
      } else {
        toast.error(t("timeSlots.loadError") || "Fehler beim Laden der Zeitslots");
      }
    } catch (error) {
      toast.error(t("timeSlots.loadError") || "Fehler beim Laden der Zeitslots");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    loadTimeSlots();
  };

  const handleApply = async () => {
    if (timeSlots.length === 0) {
      toast.error(t("applyToAll.noSlots") || "Keine Zeitslots zum Anwenden");
      return;
    }

    setIsLoading(true);
    try {
      const slotsToApply = timeSlots.map((slot) => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
        day_of_week: slot.day_of_week,
        max_participants: slot.max_participants,
      }));

      const result = await applyTimeSlotsToAllEvents(slotsToApply);

      if (result.success && result.data) {
        toast.success(
          t("applyToAll.success", { count: result.data.created }) ||
            `${result.data.created} Zeitslots auf alle Events angewendet`
        );
        if (result.data.errors.length > 0) {
          toast.warning(
            t("applyToAll.partialSuccess", { errors: result.data.errors.length }) ||
              `${result.data.errors.length} Fehler aufgetreten`
          );
        }
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || t("applyToAll.error") || "Fehler beim Anwenden");
      }
    } catch (error) {
      toast.error(t("applyToAll.error") || "Fehler beim Anwenden");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("applyToAll.title") || "Kurs auswählen"}
        </CardTitle>
        <CardDescription>
          {t("applyToAll.description") ||
            "Klicken Sie auf einen Kurs, um dessen Zeitpläne zu verwalten"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              onClick={handleOpenDialog}
              className="w-full"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              {t("applyToAll.button") || "Auf alle Kurse anwenden"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("applyToAll.dialogTitle") || "Zeitslots auf alle Events anwenden"}
              </DialogTitle>
              <DialogDescription>
                {t("applyToAll.dialogDescription") ||
                  "Diese Zeitslots werden auf alle Ihre Event Types angewendet. Bestehende Zeitslots werden nicht überschrieben."}
              </DialogDescription>
            </DialogHeader>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {t("applyToAll.noSlots") || "Keine Zeitslots gefunden"}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                      </span>
                      {slot.day_of_week !== null && (
                        <span className="text-muted-foreground ml-2">
                          ({t(`timeSlots.dayOfWeek.${slot.day_of_week}`) || `Tag ${slot.day_of_week}`})
                        </span>
                      )}
                    </div>
                    {slot.max_participants && (
                      <span className="text-muted-foreground">
                        {slot.max_participants} {t("timeSlots.form.maxParticipants") || "Teilnehmer"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                {t("applyToAll.cancel") || "Abbrechen"}
              </Button>
              <Button
                onClick={handleApply}
                disabled={isLoading || isLoadingSlots || timeSlots.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("applyToAll.applying") || "Wird angewendet..."}
                  </>
                ) : (
                  t("applyToAll.apply") || "Anwenden"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

