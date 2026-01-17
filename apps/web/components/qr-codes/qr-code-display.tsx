"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { QRCode as QRCodeType } from "@/actions/qr-codes-actions";

import { Button } from "@/components/ui/button";

interface QRCodeDisplayProps {
  qrCode: QRCodeType;
}

export function QRCodeDisplay({ qrCode }: QRCodeDisplayProps) {
  const qrUrl = `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/q/${qrCode.code}`;

  // Use a QR code API service to generate the QR code image
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl);
    toast.success("URL kopiert");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
        <img
          src={qrCodeImageUrl}
          alt={`QR Code für ${qrCode.name}`}
          className="size-64"
        />
      </div>
      <div className="text-center w-full max-w-md">
        <p className="text-sm text-muted-foreground mb-2">QR-Code URL:</p>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-3 py-2 rounded flex-1 break-all">
            {qrUrl}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
