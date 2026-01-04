"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cancelBookingByToken, getBookingByToken } from "@/actions/scheduling/bookings-actions";
import { Button } from "@/components/alignui/actions/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/alignui/data-display/card";
import { Alert, AlertDescription } from "@/components/alignui/feedback/alert";
import { Loader2, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

export default function CancelBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        } else {
          setError("Buchung nicht gefunden oder bereits storniert");
        }
      } catch (err) {
        setError("Fehler beim Laden der Buchung");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [token]);

  const handleCancel = async () => {
    if (!token) return;

    setCanceling(true);
    setError(null);

    try {
      const result = await cancelBookingByToken(token);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setError(result.error || "Fehler beim Stornieren der Buchung");
      }
    } catch (err) {
      setError("Fehler beim Stornieren der Buchung");
    } finally {
      setCanceling(false);
    }
  };

  const dateLocale = locale === "de" ? de : enUS;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
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

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Buchung storniert
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Ihre Buchung wurde erfolgreich storniert. Sie werden in Kürze zur Startseite weitergeleitet.
              </AlertDescription>
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
          <CardTitle>Buchung stornieren</CardTitle>
          <CardDescription>
            Möchten Sie diese Buchung wirklich stornieren?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking.event_type && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{booking.event_type.title}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(startDate, "EEEE, d. MMMM yyyy", { locale: dateLocale })}
                <br />
                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")} Uhr
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={canceling}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={canceling}
              className="flex-1"
            >
              {canceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Storniere...
                </>
              ) : (
                "Buchung stornieren"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

