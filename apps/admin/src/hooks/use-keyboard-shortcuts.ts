import { useEffect } from "react";

interface Shortcut {
  keys: string[];
  callback: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const keys = shortcut.keys;
        const allPressed = keys.every((key) => {
          if (key === "meta" || key === "ctrl") {
            return e.metaKey || e.ctrlKey;
          }
          if (key === "shift") {
            return e.shiftKey;
          }
          if (key === "alt") {
            return e.altKey;
          }
          return e.key.toLowerCase() === key.toLowerCase();
        });

        if (allPressed && keys.length > 0) {
          e.preventDefault();
          shortcut.callback();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
