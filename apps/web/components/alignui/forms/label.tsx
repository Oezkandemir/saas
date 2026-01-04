'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-label-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-strong-950'
);

const LabelRoot = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
LabelRoot.displayName = 'Label.Root';

const LabelAsterisk = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn('text-destructive ml-0.5', className)}
    {...props}
  >
    *
  </span>
));
LabelAsterisk.displayName = 'Label.Asterisk';

const LabelSub = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn('text-text-sub-600 font-normal ml-1', className)}
    {...props}
  />
));
LabelSub.displayName = 'Label.Sub';

// Export individual components
export { LabelRoot, LabelAsterisk, LabelSub, labelVariants };

// Export namespace object with explicit typing
export const Label: {
  Root: typeof LabelRoot;
  Asterisk: typeof LabelAsterisk;
  Sub: typeof LabelSub;
} = {
  Root: LabelRoot,
  Asterisk: LabelAsterisk,
  Sub: LabelSub,
};

