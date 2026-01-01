"use client";

import * as React from "react";
import { useState } from "react";
import {
  AlertDialog,
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
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);
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

  const ConfirmationDialog = (): React.ReactElement | null => {
    if (!options) return null;

    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {options.showNeverAskAgain && (
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="never-ask-again"
                checked={neverAskAgain}
                onCheckedChange={(checked) => setNeverAskAgain(!!checked)}
              />
              <Label
                htmlFor="never-ask-again"
                className="text-sm font-normal cursor-pointer"
              >
                Nie wieder fragen
              </Label>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText || "Abbrechen"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={options.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {options.confirmText || "Bestätigen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return {
    confirm,
    ConfirmationDialog,
  };
}

