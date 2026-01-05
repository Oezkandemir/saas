"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from '@/components/alignui/actions/button';
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyBookingLinkButtonProps {
  bookingUrl: string;
}

export function CopyBookingLinkButton({ bookingUrl }: CopyBookingLinkButtonProps) {
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
      className="gap-1.5 h-8"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("copied") || "Copied"}</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("copy") || "Copy Link"}</span>
        </>
      )}
    </Button>
  );
}






