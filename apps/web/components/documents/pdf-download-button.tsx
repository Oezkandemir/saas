"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PDFDownloadButtonProps {
  documentId: string;
  pdfUrl?: string | null;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PDFDownloadButton({
  documentId,
  pdfUrl,
  variant = "outline",
  size = "default",
}: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDownload = async () => {
    await downloadPDF(0);
  };

  const downloadPDF = async (retryCount = 0): Promise<void> => {
    setLoading(true);
    try {
      // If PDF doesn't exist, generate it first
      if (!pdfUrl) {
        const response = await fetch(`/api/documents/${documentId}/pdf`, {
          method: "POST",
        });
        
        // Handle non-JSON responses
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          throw new Error(`Server error: ${response.status} ${response.statusText}. ${text.substring(0, 200)}`);
        }
        
        if (!response.ok) {
          // Extract error message from API response with better handling
          let errorMessage = "Fehler beim Generieren des PDFs";
          
          if (data) {
            if (typeof data === "string") {
              errorMessage = data;
            } else if (data.message) {
              errorMessage = typeof data.message === "string" 
                ? data.message 
                : (data.message.message || JSON.stringify(data.message));
            } else if (data.details) {
              errorMessage = typeof data.details === "string" 
                ? data.details 
                : (data.details.message || JSON.stringify(data.details));
            } else if (data.error) {
              errorMessage = typeof data.error === "string" 
                ? data.error 
                : (data.error.message || JSON.stringify(data.error));
            } else {
              try {
                errorMessage = JSON.stringify(data);
              } catch {
                errorMessage = "Unbekannter Fehler beim Generieren des PDFs";
              }
            }
          }
          
          // Retry logic for connection errors
          const isRetryable = errorMessage.includes("ECONNRESET") || 
                             errorMessage.includes("socket hang up") ||
                             errorMessage.includes("timeout") ||
                             (response.status >= 500 && retryCount < 2);
          
          if (isRetryable && retryCount < 2) {
            console.log(`PDF generation failed, retrying... (${retryCount + 1}/2)`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return downloadPDF(retryCount + 1);
          }
          
          throw new Error(errorMessage);
        }
        
        if (!data || !data.pdfUrl) {
          throw new Error("PDF URL wurde nicht zurückgegeben");
        }
        
        // Download the generated PDF
        const link = document.createElement("a");
        link.href = data.pdfUrl;
        link.download = `document-${documentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        router.refresh();
      } else {
        // Download existing PDF
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `document-${documentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      
      let errorMessage = "Fehler beim Herunterladen des PDFs";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      alert(errorMessage);
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

