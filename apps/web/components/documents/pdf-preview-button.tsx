"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PDFPreviewButtonProps {
  documentId: string;
  pdfUrl?: string | null;
  documentNumber: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PDFPreviewButton({
  documentId,
  pdfUrl,
  documentNumber,
  variant = "outline",
  size = "sm",
}: PDFPreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(pdfUrl || null);
  const [directPdfUrl, setDirectPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && !directPdfUrl) {
      fetchPDFUrl();
    }
  }, [open, directPdfUrl]);

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
        throw new Error("PDF URL wurde nicht zurückgegeben");
      }
      
      // Use proxy endpoint for iframe (handles CORS and CSP)
      const proxyUrl = `/api/documents/${documentId}/pdf-view`;
      setDirectPdfUrl(data.pdfUrl);
      setCurrentPdfUrl(proxyUrl);
    } catch (err) {
      let errorMessage = "Fehler beim Laden des PDFs";
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
        <span className="hidden sm:inline">Vorschau</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>PDF-Vorschau: {documentNumber}</DialogTitle>
            <DialogDescription>
              Vorschau des generierten PDF-Dokuments
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-120px)] p-6 bg-muted/30">
            {loading && !currentPdfUrl ? (
              <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">PDF wird geladen...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-center space-y-4">
                <div className="text-destructive">
                  <p className="mb-2 font-semibold">Fehler beim Laden des PDFs</p>
                  <p className="text-sm">{error}</p>
                </div>
                <Button onClick={fetchPDFUrl} variant="outline">
                  Erneut versuchen
                </Button>
              </div>
            ) : currentPdfUrl ? (
              <div className="flex overflow-hidden justify-center items-center w-full rounded-lg border bg-background">
                <iframe
                  src={`${currentPdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-[600px] border-0 rounded-lg"
                  title="PDF Preview"
                  allow="fullscreen"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px]">
                <p className="text-muted-foreground">Kein PDF verfügbar</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

