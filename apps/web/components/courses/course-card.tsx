"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import { Button } from "@/components/alignui/actions/button";
import { Clock, Euro, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventType } from "@/actions/scheduling/event-types-actions";

interface CourseCardProps {
  eventType: EventType & { owner: { name: string | null; email: string | null } };
}

/**
 * CourseCard Component
 * Zeigt eine Kurs-Karte mit allen relevanten Informationen und Buchungsbutton
 */
export function CourseCard({ eventType }: CourseCardProps) {
  // Format duration
  const durationHours = Math.floor(eventType.duration_minutes / 60);
  const durationMinutes = eventType.duration_minutes % 60;
  const durationText = durationHours > 0 
    ? `${durationHours} ${durationHours === 1 ? 'Stunde' : 'Stunden'}${durationMinutes > 0 ? ` ${durationMinutes} Min` : ''}`
    : `${durationMinutes} Minuten`;

  // Format price
  const priceText = eventType.price_amount 
    ? `${eventType.price_amount.toFixed(2)} ${eventType.price_currency || 'EUR'}`
    : "Auf Anfrage";

  // Booking link
  const bookingLink = `/book/${eventType.owner_user_id}/${eventType.slug}`;

  return (
    <Card
      className="flex flex-col h-full transition-all duration-300"
      hover
    >
      <CardHeader>
        <CardTitle className="text-lg">{eventType.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {eventType.description || "Keine Beschreibung verfügbar"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{durationText}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Euro className="h-5 w-5 text-primary" />
          <span className="text-xl font-bold">{priceText}</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          asChild
          variant="primary"
          className="w-full"
          size="lg"
        >
          <Link href={bookingLink}>
            Jetzt buchen
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

