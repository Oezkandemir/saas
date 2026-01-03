'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const TableRoot = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className='relative w-full overflow-auto'>
    <table
      ref={ref}
      className={cn('w-full border-collapse', className)}
      {...props}
    />
  </div>
));
TableRoot.displayName = 'Table.Root';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('', className)} {...props} />
));
TableHeader.displayName = 'Table.Header';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('', className)} {...props} />
));
TableBody.displayName = 'Table.Body';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-stroke-soft-200 transition-colors hover:bg-bg-white-50 data-[state=selected]:bg-bg-white-100',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'Table.Row';

const TableRowDivider = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('h-px bg-stroke-soft-200', className)}
    {...props}
  />
));
TableRowDivider.displayName = 'Table.RowDivider';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle text-label-sm font-semibold text-text-strong-950 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'Table.Head';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'Table.Cell';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-stroke-soft-200 bg-bg-white-50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'Table.Footer';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-paragraph-sm text-text-sub-600', className)}
    {...props}
  />
));
TableCaption.displayName = 'Table.Caption';

// Export individual components (required for Next.js/Turbopack)
export {
  TableRoot,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableRowDivider,
  TableHead,
  TableCell,
  TableCaption,
};

// Export namespace object for AlignUI pattern
// This must be exported as a const object, not a type
export const Table = {
  Root: TableRoot,
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  RowDivider: TableRowDivider,
  Head: TableHead,
  Cell: TableCell,
  Caption: TableCaption,
};
