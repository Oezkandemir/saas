import { useEffect, useRef } from "react";
import { UseFormReturn, FieldValues, DeepPartial } from "react-hook-form";

interface UseAutoSaveOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  storageKey: string;
  enabled?: boolean;
  debounceMs?: number;
  onSave?: (data: DeepPartial<T>) => void;
  onRestore?: (data: DeepPartial<T>) => void;
}

/**
 * Hook to automatically save form data to localStorage
 * Restores data when component mounts if available
 */
export function useAutoSave<T extends FieldValues>({
  form,
  storageKey,
  enabled = true,
  debounceMs = 2000,
  onSave,
  onRestore,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isRestoredRef = useRef(false);

  // Restore data on mount
  useEffect(() => {
    if (!enabled || isRestoredRef.current) return;

    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        form.reset(parsed);
        onRestore?.(parsed);
        isRestoredRef.current = true;
      }
    } catch (error) {
      console.error("Failed to restore form data:", error);
    }
  }, [enabled, storageKey, form, onRestore]);

  // Auto-save on form changes
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((data) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to save after debounce
      timeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(data));
          onSave?.(data as DeepPartial<T>);
        } catch (error) {
          console.error("Failed to save form data:", error);
        }
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, storageKey, form, debounceMs, onSave]);

  // Clear saved data when form is submitted successfully
  const clearSavedData = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to clear saved form data:", error);
    }
  };

  return {
    clearSavedData,
    hasSavedData: () => {
      try {
        return !!localStorage.getItem(storageKey);
      } catch {
        return false;
      }
    },
  };
}

