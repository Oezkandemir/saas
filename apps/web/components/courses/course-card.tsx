"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Button } from "@/components/alignui/actions/button";
import { Clock, Euro, ArrowRight } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { EventType } from "@/actions/scheduling/event-types-actions";
import { logger } from "@/lib/logger";

interface CourseCardProps {
  eventType: EventType & { owner: { name: string | null; email: string | null } };
}

/**
 * CourseCard Component
 * Moderne Produktkarte für Kurse mit Bild, Titel, Beschreibung, Dauer und Buchen-Button
 */
export function CourseCard({ eventType }: CourseCardProps) {
  const locale = useLocale();
  
  // Format duration using the utility function
  const durationText = formatDuration(eventType.duration_minutes, "de");

  // Format price
  const priceText = eventType.price_amount 
    ? `${eventType.price_amount.toFixed(2)} ${eventType.price_currency || 'EUR'}`
    : "Auf Anfrage";

  // Booking link - ensure owner_user_id is available
  const ownerUserId = eventType.owner_user_id;
  if (!ownerUserId) {
    logger.error("EventType missing owner_user_id:", eventType);
  }
  const bookingLink = ownerUserId ? `/${locale}/book/${ownerUserId}/${eventType.slug}` : "#";

  // Placeholder image - you can add image_url to EventType later
  const imageUrl = `/illustrations/work-from-home.jpg`;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm flex flex-col h-full will-change-transform">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100" />

      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={eventType.title}
          fill
          className="object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/50 to-transparent" />
        
        {/* Duration Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1.5 text-sm font-medium shadow-lg">
          <Clock className="h-4 w-4 text-primary" />
          <span>{durationText}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-6">
        {/* Title */}
        <h3 className="mb-2 text-2xl font-bold line-clamp-2 transition-colors duration-200 group-hover:text-primary">
          {eventType.title}
        </h3>

        {/* Description */}
        <p className="mb-6 flex-1 line-clamp-3 leading-relaxed text-muted-foreground">
          {eventType.description || "Keine Beschreibung verfügbar"}
        </p>

        {/* Price and Button */}
        <div className="mt-auto space-y-4">
          {/* Price */}
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{priceText}</span>
          </div>

          {/* Book Button */}
          <Button
            asChild
            variant="primary"
            className="w-full group/button"
            size="lg"
          >
            <Link href={bookingLink} className="flex items-center justify-center gap-2">
              Jetzt buchen
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/button:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 pointer-events-none" />
    </div>
  );
}

