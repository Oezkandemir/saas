"use client";

import Image from "next/image";
import Link from "next/link";
import type { EventType } from "@/actions/scheduling/event-types-actions";
import { ArrowRight, Clock, Euro, Calendar } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { logger } from "@/lib/logger";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CourseCardProps {
  eventType: EventType & {
    owner: { name: string | null; email: string | null };
  };
}

/**
 * CourseCard Component
 * Moderne Event-Karte im Stil der Pricing-Cards
 */
export function CourseCard({ eventType }: CourseCardProps) {
  const locale = useLocale();
  const t = useTranslations("Courses");

  // Format duration using the utility function
  const durationText = formatDuration(eventType.duration_minutes, locale);

  // Format price
  const priceText = eventType.price_amount
    ? `${eventType.price_amount.toFixed(2)}`
    : t("onRequest");

  const hasPrice = eventType.price_amount && eventType.price_amount > 0;

  // Booking link - ensure owner_user_id is available
  const ownerUserId = eventType.owner_user_id;
  if (!ownerUserId) {
    logger.error("EventType missing owner_user_id:", eventType);
  }
  const bookingLink = ownerUserId
    ? `/${locale}/book/${ownerUserId}/${eventType.slug}`
    : "#";

  // Placeholder image - you can add image_url to EventType later
  const imageUrl = `/illustrations/work-from-home.jpg`;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
        "border-border bg-card hover:border-primary/20",
      )}
    >
      {/* Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-muted/50 to-muted/20 p-6 pt-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Image */}
        <div className="relative h-40 w-full mb-4 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={eventType.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/50 to-transparent" />
        </div>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
          {durationText && (
            <Badge className="bg-primary text-primary-foreground shadow-md text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {durationText}
            </Badge>
          )}
        </div>

        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 shrink-0 bg-primary/10 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold line-clamp-2 transition-colors duration-200 group-hover:text-primary">
                {eventType.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="relative">
          <div className="flex items-baseline gap-2">
            <div className="flex items-baseline">
              {hasPrice ? (
                <>
                  <Euro className="h-5 w-5 text-muted-foreground mr-1" />
                  <span className="text-4xl font-bold tracking-tight">
                    {priceText}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold tracking-tight">
                  {priceText}
                </span>
              )}
            </div>
          </div>
          {hasPrice && (
            <p className="text-xs text-muted-foreground mt-2">
              {t("perAppointment")}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Description */}
        <div className="space-y-3 text-left">
          <p className="text-sm font-medium leading-relaxed text-muted-foreground line-clamp-3">
            {eventType.description || t("noDescriptionAvailable")}
          </p>
        </div>

        {/* CTA Button */}
        <div className="mt-auto pt-4">
          <Link
            href={bookingLink}
            className={cn(
              buttonVariants({
                variant: "default",
                size: "lg",
              }),
              "w-full group/btn",
            )}
          >
            {t("bookNow")}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
