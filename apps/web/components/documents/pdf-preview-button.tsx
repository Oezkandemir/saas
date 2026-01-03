"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from '@/components/alignui/actions/button';
import { Eye, Loader2 } from "lucide-react";
import {
  DialogRoot as Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/alignui/overlays/dialog";

interface PDFPreviewButtonProps {
  documentId: string;
  pdfUrl?: string | null;
  documentNumber: string;
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

// Cache key for PDF URLs in sessionStorage
const getCacheKey = (documentId: string) => `pdf-url-${documentId}`;

export function PDFPreviewButton({
  documentId,
  pdfUrl,
  documentNumber,
  variant = "outline",
  size = "sm",
}: PDFPreviewButtonProps) {
  const t = useTranslations("Documents.pdfPreview");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(pdfUrl || null);
  const [directPdfUrl, setDirectPdfUrl] = useState<string | null>(null);

  // Load cached PDF URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedUrl = sessionStorage.getItem(getCacheKey(documentId));
      if (cachedUrl) {
        try {
          const cachedData = JSON.parse(cachedUrl);
          // Cache is valid for 1 hour
          if (Date.now() - cachedData.timestamp < 3600000) {
            setDirectPdfUrl(cachedData.pdfUrl);
            setCurrentPdfUrl(cachedData.proxyUrl);
          } else {
            // Remove expired cache
            sessionStorage.removeItem(getCacheKey(documentId));
          }
        } catch {
          // Invalid cache, remove it
          sessionStorage.removeItem(getCacheKey(documentId));
        }
      }
    }
  }, [documentId]);

  useEffect(() => {
    if (open && !directPdfUrl && !currentPdfUrl) {
      fetchPDFUrl();
    }
  }, [open, directPdfUrl, currentPdfUrl]);

  const fetchPDFUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      // First, ensure PDF exists
      const response = await fetch(`/api/documents/${documentId}/pdf`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.message || errorData.error || "Failed to generate PDF");
      }
      
      const data = await response.json();
      if (!data || !data.pdfUrl) {
        throw new Error(t("errors.noUrlReturned"));
      }
      
      // Use proxy endpoint for iframe (handles CORS and CSP)
      // Use absolute URL to avoid locale issues
      const proxyUrl = `${window.location.origin}/api/documents/${documentId}/pdf-view`;
      
      // Cache the PDF URL in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          getCacheKey(documentId),
          JSON.stringify({
            pdfUrl: data.pdfUrl,
            proxyUrl,
            timestamp: Date.now(),
          })
        );
      }
      
      setDirectPdfUrl(data.pdfUrl);
      setCurrentPdfUrl(proxyUrl);
    } catch (err) {
      let errorMessage = t("errors.loadError");
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="gap-1.5 h-8"
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("button")}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>{t("title", { number: documentNumber })}</DialogTitle>
            <DialogDescription>
              {t("description")}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-120px)] p-6 bg-muted/30">
            {loading && !currentPdfUrl ? (
              <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">{t("loading")}</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-center space-y-4">
                <div className="text-destructive">
                  <p className="mb-2 font-semibold">{t("errors.loadError")}</p>
                  <p className="text-sm">{error}</p>
                </div>
                <Button onClick={fetchPDFUrl} variant="outline">
                  {t("retry")}
                </Button>
              </div>
            ) : currentPdfUrl ? (
              <div className="flex overflow-hidden justify-center items-center w-full rounded-lg border bg-background">
                <iframe
                  src={`${currentPdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-[600px] border-0 rounded-lg"
                  title={t("iframeTitle")}
                  allow="fullscreen"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px]">
                <p className="text-muted-foreground">{t("noPdfAvailable")}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

