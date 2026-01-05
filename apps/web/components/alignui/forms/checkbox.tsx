'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { RiCheckLine } from '@remixicon/react';
import { cn } from '@/lib/utils';

const CheckboxRoot = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer size-4 shrink-0 rounded-sm border border-stroke-soft-300 bg-bg-white-0 ring-offset-bg-white-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-soft-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-stroke-soft-400 data-[state=checked]:bg-bg-white-0',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-text-strong-950')}
    >
      <RiCheckLine className='size-3.5' />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
CheckboxRoot.displayName = CheckboxPrimitive.Root.displayName;

export const Checkbox = {
  Root: CheckboxRoot,
};

// Export for compatibility
export { CheckboxRoot };











