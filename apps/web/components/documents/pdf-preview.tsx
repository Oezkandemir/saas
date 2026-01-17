"use client";

import {
  Download,
  FileText,
  Loader2,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logger } from "@/lib/logger";

interface PDFPreviewProps {
  documentId: string;
  pdfUrl?: string | null;
  onDownload?: () => void;
  showPreviewByDefault?: boolean; // Neu: Option um PDF direkt anzuzeigen
  compact?: boolean; // Neu: Kompakter Modus - zeigt nur Button und Dialog
}

export function PDFPreview({
  documentId,
  pdfUrl,
  onDownload,
  showPreviewByDefault = false,
  compact = false,
}: PDFPreviewProps) {
  const t = useTranslations("Documents.pdfPreview");
  const [scale, setScale] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(
    pdfUrl || null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(showPreviewByDefault); // Neu: Steuerung der PDF-Anzeige

  const fetchPDFUrl = async (retryCount = 0): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/pdf`);

      // Handle non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch (_jsonError) {
        const text = await response.text();
        throw new Error(
          `Server error: ${response.status} ${response.statusText}. ${text.substring(0, 200)}`
        );
      }

      if (!response.ok) {
        // Extract error message from API response with better handling
        let errorMessage = t("errors.generateError");

        if (data) {
          if (typeof data === "string") {
            errorMessage = data;
          } else if (data.details) {
            errorMessage =
              typeof data.details === "string"
                ? data.details
                : data.details.message || JSON.stringify(data.details);
          } else if (data.error) {
            errorMessage =
              typeof data.error === "string"
                ? data.error
                : data.error.message || JSON.stringify(data.error);
          } else if (data.message) {
            errorMessage =
              typeof data.message === "string"
                ? data.message
                : JSON.stringify(data.message);
          } else {
            // Try to stringify the whole object
            try {
              errorMessage = JSON.stringify(data);
            } catch {
              errorMessage = t("errors.unknownError");
            }
          }
        }

        // Retry logic for connection errors
        const isRetryable =
          errorMessage.includes("ECONNRESET") ||
          errorMessage.includes("socket hang up") ||
          errorMessage.includes("timeout") ||
          (response.status >= 500 && retryCount < 2);

        if (isRetryable && retryCount < 2) {
          logger.debug(
            `PDF generation failed, retrying... (${retryCount + 1}/2)`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          return fetchPDFUrl(retryCount + 1);
        }

        throw new Error(errorMessage);
      }

      if (!data || !data.pdfUrl) {
        throw new Error(t("errors.noUrlReturned"));
      }

      setCurrentPdfUrl(data.pdfUrl);
    } catch (err) {
      let errorMessage = t("errors.loadError");

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object") {
        try {
          errorMessage =
            (err as any).message || (err as any).error || JSON.stringify(err);
        } catch {
          errorMessage = t("errors.unknownError");
        }
      }

      logger.error("PDF generation error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPDF = async () => {
    await fetchPDFUrl(0);
  };

  // Fetch PDF URL if not provided
  useEffect(() => {
    if (!currentPdfUrl && documentId && showPdfPreview) {
      handleFetchPDF();
    }
  }, [documentId, currentPdfUrl, showPdfPreview, handleFetchPDF]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async () => {
    if (currentPdfUrl) {
      const link = document.createElement("a");
      link.href = currentPdfUrl;
      link.download = `document-${documentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onDownload?.();
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 25, 50));
  };

  const handleFitToWidth = () => {
    setScale(100);
  };

  // Kompakter Modus - nur Button, PDF öffnet im Dialog
  if (compact) {
    const handleOpenPdfPreview = () => {
      if (!currentPdfUrl) {
        fetchPDFUrl();
      }
      setShowPdfPreview(true);
      setIsFullscreen(true);
    };

    return (
      <>
        <Button
          onClick={handleOpenPdfPreview}
          variant="outline"
          size="default"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              {t("loading")}
            </>
          ) : (
            <>
              <FileText className="size-4 mr-2" />
              {t("button")}
            </>
          )}
        </Button>

        {/* Fullscreen Dialog für PDF */}
        {isFullscreen && (
          <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogContent className="max-w-[95vw] h-[95vh] p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>{t("title", { number: "" })}</DialogTitle>
                <DialogDescription>
                  {t("fullscreenDescription")}
                </DialogDescription>
              </DialogHeader>
              {loading && !currentPdfUrl ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    {t("generating")}
                  </span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 h-full">
                  <div className="text-destructive">
                    <p className="font-semibold mb-2">
                      {t("errors.generateError")}
                    </p>
                    <p className="text-sm">{error}</p>
                  </div>
                  <Button onClick={handleFetchPDF} variant="outline">
                    {t("retry")}
                  </Button>
                </div>
              ) : currentPdfUrl ? (
                <div className="size-full flex items-center justify-center bg-muted/50">
                  <iframe
                    src={`${currentPdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="size-full border-0"
                    title="PDF Fullscreen Preview"
                  />
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  // Wenn PDF-Vorschau nicht aktiviert ist, zeige Button zum Aktivieren
  if (!showPdfPreview) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 border-2 border-dashed border-muted rounded-lg">
        <FileText className="size-16 text-muted-foreground" />
        <div>
          <p className="text-lg font-semibold mb-2">{t("button")}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {t("clickToLoad")}
          </p>
        </div>
        <Button
          onClick={() => setShowPdfPreview(true)}
          variant="default"
          size="lg"
        >
          <FileText className="size-4 mr-2" />
          {t("showPreview")}
        </Button>
      </div>
    );
  }

  if (loading && !currentPdfUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{t("loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="text-destructive">
          <p className="font-semibold mb-2">{t("errors.generateError")}</p>
          <p className="text-sm">{error}</p>
        </div>
        {error.includes("Puppeteer is not installed") && (
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg max-w-md">
            <p className="font-semibold mb-2">
              {t("installationInstructions")}
            </p>
            <code className="block bg-background p-2 rounded mt-2">
              cd apps/web && pnpm install puppeteer
            </code>
          </div>
        )}
        <Button onClick={handleFetchPDF} variant="outline">
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (!currentPdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">{t("noPdfAvailable")}</p>
        <Button onClick={handleFetchPDF} variant="outline">
          {t("generatePdf")}
        </Button>
      </div>
    );
  }

  const content = (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 50}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {scale}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 200}
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleFitToWidth}>
            Fit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4 flex justify-center">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">{t("loading")}</span>
          </div>
        ) : (
          <iframe
            src={`${currentPdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${scale}`}
            className="size-full min-h-[600px] border-0 rounded shadow-lg"
            title={t("iframeTitle")}
            onLoad={() => setLoading(false)}
            onLoadStart={() => setLoading(true)}
          />
        )}
      </div>
    </div>
  );

  const fullscreenContentDetailed = (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 50}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {scale}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 200}
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleFitToWidth}>
            Fit
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(false)}
          >
            {t("close")}
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`${currentPdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${scale}`}
          className="size-full border-0"
          title="PDF Preview"
        />
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("title", { number: "" })}</DialogTitle>
            <DialogDescription>{t("fullscreenDescription")}</DialogDescription>
          </DialogHeader>
          {fullscreenContentDetailed}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background h-[600px]">
      {content}
    </div>
  );
}
