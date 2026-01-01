"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generatePDFFromElement } from "@/lib/pdf/simple-generator";
import { toast } from "sonner";

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
      // If existing PDF URL exists, download it directly
      if (pdfUrl) {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `document-${documentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Otherwise, generate PDF from preview element
      let elementToConvert: HTMLElement | null = null;

      // Try to use provided ref first
      if (previewElementRef?.current) {
        elementToConvert = previewElementRef.current;
      } else {
        // Try to find preview element automatically
        // Look for common preview container classes/ids
        const previewSelectors = [
          '[data-pdf-preview]',
          '.invoice-preview',
          '.document-preview',
          '#document-preview',
        ];

        for (const selector of previewSelectors) {
          const element = document.querySelector<HTMLElement>(selector);
          if (element) {
            elementToConvert = element;
            break;
          }
        }

        // Fallback: try to find the main content area
        if (!elementToConvert) {
          const mainContent = document.querySelector<HTMLElement>('main, [role="main"]');
          if (mainContent) {
            elementToConvert = mainContent;
          }
        }
      }

      if (!elementToConvert) {
        throw new Error(
          "Kein Vorschau-Element gefunden. Bitte stellen Sie sicher, dass die Dokumentvorschau sichtbar ist."
        );
      }

      // Generate and download PDF
      await generatePDFFromElement(elementToConvert, {
        filename: `document-${documentId}.pdf`,
        format: "a4",
        orientation: "portrait",
      });

      toast.success("PDF erfolgreich heruntergeladen");
    } catch (error) {
      console.error("Error generating PDF:", error);
      
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
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Wird generiert...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          PDF
        </>
      )}
    </Button>
  );
}

