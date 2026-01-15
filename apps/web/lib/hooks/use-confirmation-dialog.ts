"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as React from "react";
import { useState } from "react";

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  showNeverAskAgain?: boolean;
  storageKey?: string;
}

export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);
  const [neverAskAgain, setNeverAskAgain] = useState(false);

  const confirm = (opts: ConfirmationOptions): Promise<boolean> => {
    // Check if user has selected "never ask again"
    if (opts.storageKey) {
      const stored = localStorage.getItem(`confirm-${opts.storageKey}`);
      if (stored === "true") {
        return Promise.resolve(true);
      }
    }

    return new Promise((resolve) => {
      setOptions(opts);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    if (neverAskAgain && options?.storageKey) {
      localStorage.setItem(`confirm-${options.storageKey}`, "true");
    }
    resolvePromise?.(true);
    setIsOpen(false);
    setNeverAskAgain(false);
    setOptions(null);
    setResolvePromise(null);
  };

  const handleCancel = () => {
    resolvePromise?.(false);
    setIsOpen(false);
    setNeverAskAgain(false);
    setOptions(null);
    setResolvePromise(null);
  };

  const ConfirmationDialog = () => {
    if (!options) return null;

    // Use React.createElement to avoid TypeScript JSX type issues
    return React.createElement(
      AlertDialogPrimitive.Root,
      { open: isOpen, onOpenChange: setIsOpen },
      React.createElement(
        AlertDialogContent,
        null,
        React.createElement(
          AlertDialogHeader,
          null,
          React.createElement(AlertDialogTitle, null, options.title),
          React.createElement(AlertDialogDescription, null, options.description)
        ),
        options.showNeverAskAgain &&
          React.createElement(
            "div",
            { className: "flex items-center space-x-2 py-2" },
            React.createElement(Checkbox, {
              id: "never-ask-again",
              checked: neverAskAgain,
              onCheckedChange: (checked: boolean | string) =>
                setNeverAskAgain(!!checked),
            }),
            React.createElement(
              Label,
              {
                htmlFor: "never-ask-again",
                className: "text-sm font-normal cursor-pointer",
              },
              "Nie wieder fragen"
            )
          ),
        React.createElement(
          AlertDialogFooter,
          null,
          React.createElement(
            AlertDialogCancel,
            { onClick: handleCancel },
            options.cancelText || "Abbrechen"
          ),
          React.createElement(
            AlertDialogAction,
            {
              onClick: handleConfirm,
              className:
                options.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "",
            },
            options.confirmText || "Bestätigen"
          )
        )
      )
    );
  };

  return {
    confirm,
    ConfirmationDialog,
  };
}
