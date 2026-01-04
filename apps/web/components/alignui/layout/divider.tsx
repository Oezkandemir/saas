'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { SeparatorRoot } from '../data-display/separator';

interface DividerRootProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'solid-text';
  children?: React.ReactNode;
}

const DividerRoot = React.forwardRef<HTMLDivElement, DividerRootProps>(
  ({ className, variant = 'solid', children, ...props }, ref) => {
    if (variant === 'solid-text' && children) {
      return (
        <div
          ref={ref}
          className={cn('flex items-center gap-3 px-5 py-3', className)}
          {...props}
        >
          <SeparatorRoot className="flex-1" />
          <span className="text-label-xs font-medium uppercase text-text-sub-600 tracking-wider">
            {children}
          </span>
          <SeparatorRoot className="flex-1" />
        </div>
      );
    }
    return <SeparatorRoot ref={ref} className={className} {...props} />;
  }
);
DividerRoot.displayName = 'Divider.Root';

// Export individual components
export { DividerRoot };

// Export namespace object
export const Divider = {
  Root: DividerRoot,
};

