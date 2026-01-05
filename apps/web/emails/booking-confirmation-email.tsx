import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { Icons } from "../components/shared/icons";
import { siteConfig } from "@/config/site";
import { env } from "@/env.mjs";

type BookingConfirmationEmailProps = {
  inviteeName: string;
  eventTitle: string;
  eventDescription?: string | null;
  startAt: string; // ISO datetime string
  endAt: string; // ISO datetime string
  durationMinutes: number;
  locationType?: "google_meet" | "zoom" | "custom_link" | "phone" | "in_person" | null;
  locationValue?: string | null;
  hostName?: string | null;
  hostEmail?: string | null;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  numberOfParticipants: number;
  participantNames?: string[] | null;
  inviteeNotes?: string | null;
  cancelToken: string;
  bookingUrl: string;
  rescheduleToken?: string | null;
};

export const BookingConfirmationEmail = ({
  inviteeName,
  eventTitle,
  eventDescription,
  startAt,
  endAt,
  
  locationType,
  locationValue,
  hostName,
  hostEmail,
  priceAmount,
  priceCurrency,
  numberOfParticipants,
  participantNames,
  inviteeNotes,
  cancelToken,
  bookingUrl,
  rescheduleToken,
}: BookingConfirmationEmailProps) => {
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  
  // Format date and time (German format)
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cancelUrl = `${env.NEXT_PUBLIC_APP_URL}/booking/cancel?token=${cancelToken}`;
  const rescheduleUrl = rescheduleToken 
    ? `${env.NEXT_PUBLIC_APP_URL}/booking/reschedule?token=${rescheduleToken}`
    : null;

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getLocationDisplay = () => {
    if (!locationType || !locationValue) return null;
    
    switch (locationType) {
      case "google_meet":
        return { label: "Google Meet", link: locationValue };
      case "zoom":
        return { label: "Zoom", link: locationValue };
      case "custom_link":
        return { label: "Meeting-Link", link: locationValue };
      case "phone":
        return { label: "Telefon", link: `tel:${locationValue}` };
      case "in_person":
        return { label: "Vor Ort", address: locationValue };
      default:
        return null;
    }
  };

  const location = getLocationDisplay();

  return (
    <Html>
      <Head />
      <Preview>
        Ihre Buchung für "{eventTitle}" am {formatDate(startDate)} um {formatTime(startDate)} Uhr wurde bestätigt.
      </Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-5 pb-12">
            <Icons.logo className="m-auto block size-10" />
            
            <Text className="text-base">Hallo {inviteeName},</Text>
            
            <Text className="text-base">
              Ihre Buchung wurde erfolgreich bestätigt! Hier sind alle wichtigen Informationen zu Ihrer Terminbuchung:
            </Text>

            <Section className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
              <Text className="mb-4 text-lg font-semibold">{eventTitle}</Text>
              
              {eventDescription && (
                <Text className="mb-4 text-sm text-gray-600">{eventDescription}</Text>
              )}

              <Text className="mb-2 text-sm font-semibold">Datum & Uhrzeit:</Text>
              <Text className="mb-4 text-sm">
                {formatDate(startDate)}<br />
                {formatTime(startDate)} - {formatTime(endDate)} Uhr
              </Text>

              {location && (
                <>
                  <Text className="mb-2 text-sm font-semibold">Ort:</Text>
                  {location.link ? (
                    <Text className="mb-4 text-sm">
                      <a href={location.link} className="text-blue-600 underline">
                        {location.label}
                      </a>
                    </Text>
                  ) : (
                    <Text className="mb-4 text-sm">
                      {location.label}: {location.address}
                    </Text>
                  )}
                </>
              )}

              {hostName && (
                <>
                  <Text className="mb-2 text-sm font-semibold">Ihr Gastgeber:</Text>
                  <Text className="mb-4 text-sm">
                    {hostName}
                    {hostEmail && ` (${hostEmail})`}
                  </Text>
                </>
              )}

              {numberOfParticipants > 1 && (
                <>
                  <Text className="mb-2 text-sm font-semibold">Teilnehmer:</Text>
                  <Text className="mb-4 text-sm">
                    {numberOfParticipants} Person{numberOfParticipants > 1 ? "en" : ""}
                    {participantNames && participantNames.length > 0 && (
                      <>
                        <br />
                        {participantNames.join(", ")}
                      </>
                    )}
                  </Text>
                </>
              )}

              {priceAmount && priceCurrency && (
                <>
                  <Text className="mb-2 text-sm font-semibold">Preis:</Text>
                  <Text className="mb-4 text-sm font-semibold text-green-600">
                    {formatPrice(priceAmount, priceCurrency)}
                  </Text>
                </>
              )}

              {inviteeNotes && (
                <>
                  <Text className="mb-2 text-sm font-semibold">Ihre Notizen:</Text>
                  <Text className="mb-4 text-sm text-gray-600">{inviteeNotes}</Text>
                </>
              )}
            </Section>

            <Section className="my-5 space-y-3">
              {location?.link && (
                <div className="text-center">
                  <Button
                    className="inline-block rounded-md bg-blue-600 px-6 py-3 text-base text-white no-underline"
                    href={location.link}
                  >
                    Meeting beitreten
                  </Button>
                </div>
              )}
              
              <div className="text-center">
                <Button
                  className="inline-block rounded-md bg-zinc-900 px-6 py-3 text-base text-white no-underline"
                  href={bookingUrl}
                >
                  Buchungsdetails anzeigen
                </Button>
              </div>

              {rescheduleUrl && (
                <div className="text-center">
                  <Button
                    className="inline-block rounded-md bg-gray-600 px-6 py-3 text-base text-white no-underline"
                    href={rescheduleUrl}
                  >
                    Termin verschieben
                  </Button>
                </div>
              )}

              <div className="text-center">
                <Button
                  className="inline-block rounded-md bg-red-600 px-6 py-3 text-base text-white no-underline"
                  href={cancelUrl}
                >
                  Buchung stornieren
                </Button>
              </div>
            </Section>

            <Text className="text-sm text-gray-600">
              Falls Sie Fragen haben oder den Termin ändern möchten, können Sie die obigen Links verwenden oder direkt mit {hostName || "dem Gastgeber"} Kontakt aufnehmen.
            </Text>

            <Hr className="my-4 border-t-2 border-gray-300" />
            
            <Text className="text-xs text-gray-500">
              Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.
            </Text>
            
            <Text className="text-xs text-gray-500">
              {siteConfig.name} - {siteConfig.url}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

