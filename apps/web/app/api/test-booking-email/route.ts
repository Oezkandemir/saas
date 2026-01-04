import { NextRequest, NextResponse } from "next/server";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Ungültige E-Mail-Adresse" },
        { status: 400 }
      );
    }

    logger.info("Test booking email requested", { email, userId: user.id });

    // Send test booking confirmation email
    const result = await sendBookingConfirmationEmail({
      inviteeEmail: email,
      inviteeName: "Test Benutzer",
      eventTitle: "Test-Termin",
      eventDescription: "Dies ist eine Test-Buchungsbestätigung",
      startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // Tomorrow + 30 min
      durationMinutes: 30,
      locationType: "google_meet",
      locationValue: "https://meet.google.com/test",
      hostUserId: user.id,
      priceAmount: 50,
      priceCurrency: "EUR",
      numberOfParticipants: 1,
      participantNames: null,
      inviteeNotes: "Test-Notiz",
      cancelToken: "test-cancel-token",
      rescheduleToken: "test-reschedule-token",
      eventSlug: "test-termin",
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test-E-Mail wurde gesendet! Message ID: ${result.messageId}`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Fehler beim Senden: ${result.error}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error in test-booking-email route", error);
    return NextResponse.json(
      {
        success: false,
        message: `Fehler: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
      },
      { status: 500 }
    );
  }
}

