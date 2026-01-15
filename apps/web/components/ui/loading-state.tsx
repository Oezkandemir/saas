"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

import { LoadingOverlay } from "./loading-overlay";
import { LoadingSpinner } from "./loading-spinner";

interface LoadingStateProps {
  /**
   * Whether the component is currently loading
   */
  isLoading: boolean;

  /**
   * Optional text to display below the spinner
   */
  text?: string;

  /**
   * Size of the spinner
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";

  /**
   * Variant of the spinner
   * @default "default"
   */
  variant?: "default" | "primary" | "muted";

  /**
   * Display mode: "spinner" shows a centered spinner, "overlay" shows a full overlay
   * @default "spinner"
   */
  mode?: "spinner" | "overlay";

  /**
   * Minimum height for the spinner container (useful for maintaining layout)
   * @default "auto"
   */
  minHeight?: string | number;

  /**
   * Additional className for the container
   */
  className?: string;

  /**
   * Children to render when not loading
   */
  children?: React.ReactNode;

  /**
   * Whether to show a subtle background when using spinner mode
   * @default false
   */
  showBackground?: boolean;
}

/**
 * Intelligent LoadingState component that automatically chooses the best loading display.
 *
 * - Use "spinner" mode for quick API calls and component-level loading
 * - Use "overlay" mode for blocking operations that need to prevent interaction
 *
 * @example
 * ```tsx
 * <LoadingState isLoading={isLoading} text="Lade Daten...">
 *   <YourContent />
 * </LoadingState>
 * ```
 */
export function LoadingState({
  isLoading,
  text,
  size = "md",
  variant = "default",
  mode = "spinner",
  minHeight = "auto",
  className,
  children,
  showBackground = false,
}: LoadingStateProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  if (mode === "overlay") {
    return (
      <div className={cn("relative", className)} style={{ minHeight }}>
        {children}
        <LoadingOverlay isLoading={isLoading} text={text} spinnerSize={size} />
      </div>
    );
  }

  // Spinner mode - centered spinner
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        showBackground && "bg-muted/30 rounded-lg",
        className
      )}
      style={{
        minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
      }}
    >
      <LoadingSpinner size={size} variant={variant} text={text} />
    </div>
  );
}

/**
 * Convenience component for inline loading states (e.g., in cards, lists)
 */
export function InlineLoadingState({
  isLoading,
  text,
  size = "sm",
  className,
  children,
}: Omit<LoadingStateProps, "mode" | "minHeight" | "showBackground">) {
  return (
    <LoadingState
      isLoading={isLoading}
      text={text}
      size={size}
      mode="spinner"
      className={cn("py-8", className)}
      showBackground={false}
    >
      {children}
    </LoadingState>
  );
}

/**
 * Convenience component for full-page or section loading states
 */
export function SectionLoadingState({
  isLoading,
  text,
  size = "lg",
  minHeight = 200,
  className,
  children,
}: Omit<LoadingStateProps, "mode">) {
  return (
    <LoadingState
      isLoading={isLoading}
      text={text}
      size={size}
      mode="spinner"
      minHeight={minHeight}
      className={className}
      showBackground={true}
    >
      {children}
    </LoadingState>
  );
}
