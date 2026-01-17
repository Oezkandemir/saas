"use client";

import { useEffect, useRef } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if key is undefined or empty
      if (!e.key || !e.key.trim()) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        // Skip if shortcut key is undefined or empty
        if (!shortcut.key || !shortcut.key.trim()) {
          continue;
        }

        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey ? e.ctrlKey : !e.ctrlKey;
        const matchesMeta = shortcut.metaKey ? e.metaKey : !e.metaKey;
        const matchesShift = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;

        // Skip if input/textarea/contenteditable is focused
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          continue;
        }

        if (matchesKey && matchesCtrl && matchesMeta && matchesShift) {
          e.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
