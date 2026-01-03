/**
 * AlignUI - Button Component (Free Base Component)
 * 
 * Based on AlignUI design system using Radix UI and Tailwind CSS
 * Source: alignui.com/docs/v1.2/components/actions/button
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base Styles - Konsistente Spacing (8px Grid), klare Focus States
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary: klar & dominant
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:bg-primary/95",
        // Secondary: zurückhaltend
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50",
        // Ghost: minimal
        ghost: 
          "bg-transparent hover:bg-accent hover:text-accent-foreground",
        // Destructive: nur für destruktive Aktionen
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        // Outline: Alternative zu Secondary
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        // Konsistente Größen basierend auf 8px Grid
        sm: "h-9 px-3 text-sm",      // 36px height, 12px horizontal padding
        default: "h-10 px-4 text-sm", // 40px height, 16px horizontal padding
        lg: "h-11 px-6 text-base",   // 44px height, 24px horizontal padding
        icon: "h-10 w-10",           // 40x40px für Icon-Buttons
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

// Main Button component
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Alias for backward compatibility
export const ButtonRoot = Button;

// Icon component for Button
interface ButtonIconProps {
  as: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const ButtonIcon = ({ as: Icon, className }: ButtonIconProps) => {
  return <Icon className={className} />;
};
ButtonIcon.displayName = "Button.Icon";

// Export variants
export { buttonVariants };
