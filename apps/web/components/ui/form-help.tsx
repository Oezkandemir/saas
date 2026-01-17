"use client";

import { ExternalLink, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FormHelpProps {
  content: string;
  example?: string;
  link?: {
    href: string;
    text: string;
  };
  className?: string;
}

export function FormHelp({ content, example, link, className }: FormHelpProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors",
              className
            )}
            aria-label="Hilfe anzeigen"
          >
            <HelpCircle className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="text-sm">{content}</p>
            {example && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-1">Beispiel:</p>
                <p className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                  {example}
                </p>
              </div>
            )}
            {link && (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                {link.text}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface FormHelpInlineProps {
  content: string;
  example?: string;
  link?: {
    href: string;
    text: string;
  };
}

export function FormHelpInline({
  content,
  example,
  link,
}: FormHelpInlineProps) {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p>{content}</p>
      {example && (
        <p className="font-mono bg-muted p-1 rounded text-[10px]">
          Beispiel: {example}
        </p>
      )}
      {link && (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          {link.text}
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}
