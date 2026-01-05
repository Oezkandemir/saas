"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/alignui/actions/button";

interface CopyBookingLinkButtonProps {
  bookingUrl: string;
}

export function CopyBookingLinkButton({
  bookingUrl,
}: CopyBookingLinkButtonProps) {
  const t = useTranslations("Scheduling.eventTypes.detail.share");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success(t("copied") || "Booking link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t("copyError") || "Failed to copy link");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 w-full bg-bg-white-0 dark:bg-bg-white-0 text-text-strong-950 dark:text-text-strong-950 border-stroke-soft-200 hover:bg-bg-white-50 dark:hover:bg-bg-white-50"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span className="text-xs">{t("copied") || "Kopiert"}</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span className="text-xs">{t("copy") || "Link kopieren"}</span>
        </>
      )}
    </Button>
  );
}
