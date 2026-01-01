import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatusBarItem {
  label: string;
  value: string | number;
  icon: ReactNode;
}

interface StatusBarProps {
  items: StatusBarItem[];
  className?: string;
}

export function StatusBar({ items, className }: StatusBarProps) {
  return (
    <div 
      className={cn(
        "border-b border-border bg-muted/30 py-4",
        className
      )}
    >
      <div className="flex gap-6 overflow-x-auto px-4 sm:px-6">
        {items.map((item, index) => {
          return (
            <div
              key={index}
              className="flex flex-col items-start gap-2 min-w-[80px] shrink-0"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50 border border-border/40 shrink-0">
                <div className="text-muted-foreground">
                  {item.icon}
                </div>
              </div>
              <span className="text-2xl font-bold leading-none">
                {item.value}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

