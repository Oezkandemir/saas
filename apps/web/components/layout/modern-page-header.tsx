"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ModernPageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  actions?: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function ModernPageHeader({
  title,
  description,
  icon,
  showBackButton = false,
  backHref,
  actions,
  className,
  sticky = false,
}: ModernPageHeaderProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!sticky) return;

    const handleScroll = () => {
      // Check if scrolled past main header (60px) + some threshold
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sticky]);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-2.5 sm:py-3 bg-background",
        sticky && isScrolled && "shadow-sm backdrop-blur-sm bg-background/95",
        className
      )}
    >
      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0 h-7 w-7 sm:h-8 sm:w-8"
            aria-label="Zurück"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        )}

        {/* Icon */}
        {icon && (
          <div className="shrink-0">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-muted/40 border border-border/50">
              {icon}
            </div>
          </div>
        )}

        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold truncate leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

