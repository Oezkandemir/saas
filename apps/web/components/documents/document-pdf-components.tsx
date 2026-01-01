"use client";

import dynamic from "next/dynamic";
import type { Document } from "@/actions/documents-actions";

// Dynamic imports for heavy PDF components with SSR disabled
const PDFDownloadButton = dynamic(() => import("@/components/documents/pdf-download-button").then(mod => ({ default: mod.PDFDownloadButton })), {
  ssr: false,
});

const DocumentEmailButton = dynamic(() => import("@/components/documents/document-email-button").then(mod => ({ default: mod.DocumentEmailButton })), {
  ssr: false,
});

const InvoiceCompactPreview = dynamic(() => import("@/components/documents/invoice-compact-preview").then(mod => ({ default: mod.InvoiceCompactPreview })), {
  loading: () => <div className="p-4 text-center text-muted-foreground">Loading preview...</div>,
  ssr: false,
});

const InvoiceFullscreenButton = dynamic(() => import("@/components/documents/invoice-fullscreen-button").then(mod => ({ default: mod.InvoiceFullscreenButton })), {
  ssr: false,
});

interface PDFActionButtonsProps {
  documentId: string;
  pdfUrl?: string | null;
  customerEmail?: string | null;
  documentNumber: string;
  documentType: "quote" | "invoice";
}

export function PDFActionButtons({
  documentId,
  pdfUrl,
  customerEmail,
  documentNumber,
  documentType,
}: PDFActionButtonsProps) {
  return (
    <>
      <PDFDownloadButton documentId={documentId} pdfUrl={pdfUrl} />
      {customerEmail && (
        <DocumentEmailButton
          documentId={documentId}
          recipientEmail={customerEmail}
          documentNumber={documentNumber}
          documentType={documentType}
        />
      )}
    </>
  );
}

interface InvoicePreviewHeaderProps {
  document: Document;
}

export function InvoicePreviewHeader({ document }: InvoicePreviewHeaderProps) {
  return <InvoiceFullscreenButton document={document} />;
}

interface InvoicePreviewContentProps {
  document: Document;
}

export function InvoicePreviewContent({ document }: InvoicePreviewContentProps) {
  return <InvoiceCompactPreview document={document} />;
}

