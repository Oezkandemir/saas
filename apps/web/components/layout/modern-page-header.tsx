"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from '@/components/alignui/actions/button';

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
        // Kompakte Abstände: gap-2 sm:gap-3
        "flex items-center justify-between gap-2 sm:gap-3 bg-background",
        sticky && isScrolled && "shadow-sm backdrop-blur-sm bg-background/95",
        className
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
            aria-label="Zurück"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Icon - Kleinere Größen: w-8 h-8 sm:w-9 sm:h-9 */}
        {icon && (
          <div className="shrink-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-muted/50 border border-border/20">
              {icon}
            </div>
          </div>
        )}

        {/* Title and Description - Responsive Typography */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold truncate leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-tight mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

