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
  // Base Styles - AlignUI Pro Button Styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-soft-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
      variants: {
        variant: {
          // Primary: AlignUI Pro - Dark button on light background
          primary:
            "bg-text-strong-950 text-bg-white-0 hover:bg-text-strong-900 shadow-sm hover:shadow-md active:bg-text-strong-950 font-semibold",
          // Secondary: zurückhaltend
          secondary:
            "bg-bg-white-50 text-text-strong-950 hover:bg-bg-white-100 border border-stroke-soft-200 shadow-sm",
          // Neutral: AlignUI neutral variant
          neutral:
            "bg-bg-white-50 text-text-strong-950 hover:bg-bg-white-100 shadow-sm hover:shadow-md",
          // Ghost: minimal
          ghost: 
            "bg-transparent hover:bg-bg-white-50 text-text-strong-950",
          // Destructive: nur für destruktive Aktionen
          destructive:
            "bg-destructive text-bg-white-0 hover:bg-destructive/90 shadow-sm hover:shadow-md",
          // Outline: Alternative zu Secondary
          outline:
            "border border-stroke-soft-200 bg-bg-white-0 text-text-strong-950 hover:bg-bg-white-50 shadow-sm",
        },
        mode: {
          solid: "",
          stroke: "border-2 border-stroke-soft-200 bg-bg-white-0 text-text-strong-950 hover:bg-bg-white-50 hover:border-stroke-soft-300 font-medium",
        },
      size: {
        // Konsistente Größen basierend auf 8px Grid - AlignUI Pro Standards
        xsmall: "h-8 px-3 text-xs",     // 32px height
        sm: "h-9 px-4 text-sm",         // 36px height
        default: "h-10 px-4 text-sm",  // 40px height
        medium: "h-11 px-5 text-sm font-medium",  // 44px height - Größer für bessere Sichtbarkeit
        lg: "h-12 px-6 text-base font-medium",    // 48px height
        icon: "h-10 w-10",              // 40x40px für Icon-Buttons
      },
    },
    defaultVariants: {
      variant: "primary",
      mode: "solid",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  mode?: "solid" | "stroke";
}

// Main Button component
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, mode, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, mode, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Alias for AlignUI namespace pattern
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

// Export namespace object for AlignUI pattern compatibility
export const ButtonNamespace = {
  Root: Button,
  Icon: ButtonIcon,
};
