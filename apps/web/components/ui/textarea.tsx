import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// Character counter component
interface TextareaCharCounterProps {
  current: number;
  max?: number;
  className?: string;
}

const TextareaCharCounter = ({
  current,
  max,
  className,
}: TextareaCharCounterProps) => {
  if (!max) return null;
  return (
    <div
      className={cn(
        "text-xs text-muted-foreground text-right mt-1",
        current > max && "text-destructive",
        className
      )}
    >
      {current}/{max}
    </div>
  );
};
TextareaCharCounter.displayName = "Textarea.CharCounter";

export { Textarea, TextareaCharCounter };
