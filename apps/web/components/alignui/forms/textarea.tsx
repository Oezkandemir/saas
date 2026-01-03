'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextareaRoot = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-20 w-full rounded-md border border-stroke-soft-200 bg-bg-white-0 px-3 py-2 text-label-sm text-text-strong-950 ring-offset-bg-white-0 placeholder:text-text-sub-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-soft-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
TextareaRoot.displayName = 'Textarea.Root';

// Export individual components
export { TextareaRoot };

// Export namespace object
export const Textarea = {
  Root: TextareaRoot,
};

