'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Image, File, FileCode, FileSpreadsheet } from 'lucide-react';

export type FileFormat = 'PDF' | 'DOC' | 'DOCX' | 'XLS' | 'XLSX' | 'PNG' | 'JPG' | 'JPEG' | 'GIF' | 'SVG' | 'TXT' | 'CSV' | 'ZIP' | 'RAR';
export type FileFormatSize = 'small' | 'medium' | 'large';
export type FileFormatColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray';

interface FileFormatIconProps {
  format: FileFormat;
  size?: FileFormatSize;
  color?: FileFormatColor;
  className?: string;
}

const sizeMap: Record<FileFormatSize, string> = {
  small: 'size-6',
  medium: 'size-8',
  large: 'size-10',
};

const colorMap: Record<FileFormatColor, string> = {
  red: 'text-red-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  purple: 'text-purple-500',
  gray: 'text-gray-500',
};

const getIconForFormat = (format: FileFormat) => {
  const upperFormat = format.toUpperCase();
  
  if (upperFormat === 'PDF') return FileText;
  if (['DOC', 'DOCX'].includes(upperFormat)) return FileText;
  if (['XLS', 'XLSX'].includes(upperFormat)) return FileSpreadsheet;
  if (['PNG', 'JPG', 'JPEG', 'GIF', 'SVG'].includes(upperFormat)) return Image;
  if (['TXT', 'CSV'].includes(upperFormat)) return FileCode;
  if (['ZIP', 'RAR'].includes(upperFormat)) return File;
  
  return File;
};

const FileFormatIconRoot = React.forwardRef<HTMLDivElement, FileFormatIconProps>(
  ({ format, size = 'small', color = 'gray', className, ...props }, ref) => {
    const Icon = getIconForFormat(format);
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded',
          sizeMap[size],
          className
        )}
        {...props}
      >
        <Icon className={cn('size-full', colorMap[color])} />
      </div>
    );
  }
);
FileFormatIconRoot.displayName = 'FileFormatIcon.Root';

export const FileFormatIcon = {
  Root: FileFormatIconRoot,
};

// Export for compatibility
export { FileFormatIconRoot };













