"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

const DrawerRoot = ({
  shouldScaleBackground = true,
  direction = "bottom",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  direction?: "top" | "bottom" | "left" | "right";
}) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    direction={direction}
    {...props}
  />
);
DrawerRoot.displayName = "Drawer.Root";

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-bg-white-0/80 backdrop-blur-sm",
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = "Drawer.Overlay";

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    side?: "top" | "bottom" | "left" | "right";
  }
>(({ className, children, side, ...props }, ref) => {
  const isRightSide = side === "right";
  const isLeftSide = side === "left";
  const isTopSide = side === "top";

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col border border-stroke-soft-200 bg-bg-white-0 shadow-custom-md",
          isRightSide &&
            "inset-y-0 right-0 h-full w-[min(400px,calc(100%-16px))] rounded-none",
          isLeftSide &&
            "inset-y-0 left-0 h-full w-[min(400px,calc(100%-16px))] rounded-none",
          isTopSide && "inset-x-0 top-0 h-auto max-h-[85vh] rounded-none",
          !isRightSide &&
            !isLeftSide &&
            !isTopSide &&
            "inset-x-0 bottom-0 h-auto max-h-[85vh] rounded-none",
          className,
        )}
        {...props}
      >
        {!isRightSide && !isLeftSide && (
          <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-bg-white-50" />
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "Drawer.Content";

const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto", className)} {...props} />
);
DrawerBody.displayName = "Drawer.Body";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-5 text-center sm:text-left", className)}
    {...props}
  />
);
DrawerHeader.displayName = "Drawer.Header";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-auto flex flex-col gap-2 border-t border-stroke-soft-200 p-5",
      className,
    )}
    {...props}
  />
);
DrawerFooter.displayName = "Drawer.Footer";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-label-lg font-semibold leading-none tracking-tight text-text-strong-950",
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = "Drawer.Title";

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-paragraph-sm text-text-sub-600", className)}
    {...props}
  />
));
DrawerDescription.displayName = "Drawer.Description";

// Export individual components
export {
  DrawerRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};

// Export namespace object
export const Drawer = {
  Root: DrawerRoot,
  Portal: DrawerPortal,
  Overlay: DrawerOverlay,
  Trigger: DrawerTrigger,
  Close: DrawerClose,
  Content: DrawerContent,
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Title: DrawerTitle,
  Description: DrawerDescription,
};
