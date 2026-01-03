'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border border-stroke-soft-200 p-4 [&>svg]:absolute [&>svg]:text-text-strong-950 [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11',
  {
    variants: {
      variant: {
        default: 'bg-bg-white-0 text-text-strong-950',
        destructive:
          'text-destructive border-destructive/50 dark:border-destructive [&>svg]:text-destructive text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const AlertRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role='alert'
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
AlertRoot.displayName = 'Alert.Root';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      'mb-1 font-medium leading-none tracking-tight text-label-sm text-text-strong-950',
      className
    )}
    {...props}
  />
));
AlertTitle.displayName = 'Alert.Title';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-paragraph-sm text-text-sub-600 [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'Alert.Description';

// Export individual components
export { AlertRoot, AlertTitle, AlertDescription, alertVariants };

// Export namespace object
export const Alert = {
  Root: AlertRoot,
  Title: AlertTitle,
  Description: AlertDescription,
};

