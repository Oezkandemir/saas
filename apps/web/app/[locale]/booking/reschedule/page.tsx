"use client";

import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar, Info, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { getBookingByToken } from "@/actions/scheduling/bookings-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RescheduleBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Kein Token angegeben");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const result = await getBookingByToken(token);
        if (result.success && result.data) {
          setBooking(result.data);
          // Redirect to booking page to reschedule
          if (result.data.event_type) {
            router.push(
              `/book/${result.data.host_user_id}/${result.data.event_type.slug}`
            );
          }
        } else {
          setError("Buchung nicht gefunden");
        }
      } catch (_err) {
        setError("Fehler beim Laden der Buchung");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [token, router]);

  const dateLocale = locale === "de" ? de : enUS;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-red-500" />
              Fehler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const startDate = new Date(booking.start_at);
  const endDate = new Date(booking.end_at);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Termin verschieben</CardTitle>
          <CardDescription>
            Sie werden zur Buchungsseite weitergeleitet...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking.event_type && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="font-semibold">
                  {booking.event_type.title}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Aktueller Termin:{" "}
                {format(startDate, "EEEE, d. MMMM yyyy", {
                  locale: dateLocale,
                })}
                <br />
                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")} Uhr
              </div>
            </div>
          )}

          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              Bitte stornieren Sie zuerst die aktuelle Buchung, bevor Sie einen
              neuen Termin buchen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
