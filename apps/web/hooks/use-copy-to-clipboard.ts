"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string, successMessage?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage || "In Zwischenablage kopiert");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Fehler beim Kopieren");
    }
  };

  return { copy, copied, CopyIcon: copied ? Check : Copy };
}


