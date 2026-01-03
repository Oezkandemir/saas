'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

const ProgressBarRoot = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-bg-white-50',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className='size-full flex-1 bg-primary transition-all'
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
ProgressBarRoot.displayName = 'ProgressBar.Root';

// Export individual components
export { ProgressBarRoot };

// Export namespace object
export const ProgressBar = {
  Root: ProgressBarRoot,
};

export const Progress = {
  Root: ProgressBarRoot,
};

