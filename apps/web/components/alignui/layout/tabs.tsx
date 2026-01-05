"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const TabsRoot = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-bg-white-50 p-1 text-text-sub-600",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "Tabs.List";

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-label-sm font-medium ring-offset-bg-white-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-soft-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-bg-white-0 data-[state=active]:text-text-strong-950 data-[state=active]:shadow-regular-xs",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "Tabs.Trigger";

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-bg-white-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-soft-400 focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = "Tabs.Content";

// Export individual components
export { TabsRoot, TabsList, TabsTrigger, TabsContent };

// Export namespace object
export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};

