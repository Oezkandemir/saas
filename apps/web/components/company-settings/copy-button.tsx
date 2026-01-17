"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { logger } from "@/lib/logger";

interface CopyButtonProps {
  value: string;
  className?: string;
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error("Failed to copy:", error);
    }
  };

  return (
    <button
      className={`size-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded hover:bg-muted ${className}`}
      onClick={handleCopy}
      title={copied ? "Kopiert!" : "Kopieren"}
    >
      {copied ? (
        <Check className="size-3 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}
