"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
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
}

export function ModernPageHeader({
  title,
  description,
  icon,
  showBackButton = false,
  backHref,
  actions,
  className,
}: ModernPageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("mb-6 animate-in fade-in slide-in-from-top-4 duration-500", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Back Button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0 h-9 w-9 mt-0.5 hover:bg-muted transition-colors"
              aria-label="Zurück"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Icon */}
          {icon && (
            <div className="shrink-0 mt-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                {icon}
              </div>
            </div>
          )}

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1.5">
              {title}
            </h1>
            {description && (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
    </div>
  );
}

