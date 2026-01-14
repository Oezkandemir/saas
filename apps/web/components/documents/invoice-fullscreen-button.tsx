"use client";

import { useState } from "react";
import { Document } from "@/actions/documents-actions";
import { Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { InvoiceFullPreview } from "./invoice-full-preview";

interface InvoiceFullscreenButtonProps {
  document: Document;
}

export function InvoiceFullscreenButton({
  document,
}: InvoiceFullscreenButtonProps) {
  const t = useTranslations("Documents.preview");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="default">
        <Maximize2 className="h-4 w-4 mr-2" />
        {t("fullscreenButton")}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("fullscreenTitle")}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[95vh]">
            <InvoiceFullPreview document={document} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
