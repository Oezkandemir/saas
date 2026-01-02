"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface PDFDownloadButtonProps {
  documentId: string;
  pdfUrl?: string | null;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  /**
   * Optional: Pass a ref to the element to convert to PDF
   * If not provided, will try to find the preview element automatically
   */
  previewElementRef?: React.RefObject<HTMLElement>;
}

export function PDFDownloadButton({
  documentId,
  pdfUrl,
  variant = "outline",
  size = "default",
  previewElementRef,
}: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Always generate a fresh PDF to ensure it's valid
      // Fetch PDF from API which will generate it if needed
      const response = await fetch(`/api/documents/${documentId}/pdf?force=true`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.message || errorData.error || "Failed to generate PDF");
      }
      
      const data = await response.json();
      const pdfUrlToDownload = data.pdfUrl || pdfUrl;
      
      if (!pdfUrlToDownload) {
        throw new Error("PDF URL not available");
      }
      
      // Fetch PDF as blob for direct download
      const pdfResponse = await fetch(pdfUrlToDownload);
      if (!pdfResponse.ok) {
        throw new Error("Fehler beim Laden des PDFs");
      }
      
      const blob = await pdfResponse.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `document-${documentId}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL after a delay
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
      
      toast.success("PDF erfolgreich heruntergeladen");
    } catch (error) {
      logger.error("Error generating PDF", error);
      
      let errorMessage = "Fehler beim Generieren des PDFs";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading}
      className="gap-1.5 h-8"
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="hidden sm:inline">Wird generiert...</span>
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download</span>
        </>
      )}
    </Button>
  );
}

