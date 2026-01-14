"use client";

import { useEffect, useState } from "react";
import { Customer } from "@/actions/customers-actions";
import { CheckCircle2, Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CustomerQRCodeProps {
  customer: Customer;
}

export function CustomerQRCode({ customer }: CustomerQRCodeProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Use NEXT_PUBLIC_APP_URL for consistent server/client rendering
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000");
    setQrUrl(`${baseUrl}/c/${customer.qr_code}`);
  }, [customer.qr_code]);

  if (!customer.qr_code) {
    return (
      <Card className="border-2 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-muted-foreground" />
            QR-Code
          </CardTitle>
          <CardDescription>
            Für diesen Kunden wurde noch kein QR-Code generiert.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Use QR code API service to generate the QR code image
  const qrCodeImageUrl = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(qrUrl)}`
    : "";

  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(qrUrl);
      toast.success("URL kopiert", {
        description: "Die QR-Code-URL wurde in die Zwischenablage kopiert.",
      });
    } catch (error) {
      toast.error("Fehler beim Kopieren", {
        description: "Die URL konnte nicht kopiert werden.",
      });
    } finally {
      setTimeout(() => setIsCopying(false), 1000);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-code-${customer.name.replace(/\s+/g, "-")}-${customer.qr_code}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("QR-Code heruntergeladen", {
        description: "Der QR-Code wurde erfolgreich heruntergeladen.",
      });
    } catch (error) {
      toast.error("Fehler beim Download", {
        description: "Der QR-Code konnte nicht heruntergeladen werden.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="border-2 shadow-lg transition-all duration-300 hover:shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
          <QrCode className="h-5 w-5 text-primary" />
          QR-Code
        </CardTitle>
        <CardDescription className="animate-in fade-in slide-in-from-left-4 duration-700">
          Scannen Sie diesen QR-Code, um schnell auf die Kundendaten
          zuzugreifen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMounted || !qrUrl ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                <img
                  src={qrCodeImageUrl}
                  alt={`QR Code für ${customer.name}`}
                  className="w-64 h-64 transition-opacity duration-300"
                  loading="lazy"
                />
              </div>

              <div className="text-center w-full max-w-md space-y-3">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    QR-Code URL:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-3 py-2 rounded flex-1 break-all text-left font-mono transition-all duration-200 hover:bg-muted/80">
                      {qrUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      disabled={isCopying}
                      className="shrink-0 transition-all duration-200 hover:scale-110 active:scale-95"
                      title="URL kopieren"
                    >
                      {isCopying ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in duration-200" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 justify-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400">
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="gap-2 h-11 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                  >
                    {isDownloading ? (
                      <>
                        <LoadingSpinner size="sm" variant="primary" />
                        <span>Wird heruntergeladen...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        QR-Code herunterladen
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
