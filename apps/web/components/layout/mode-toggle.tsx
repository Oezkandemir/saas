"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Button } from '@/components/alignui/actions/button';
import { Icons } from "@/components/shared/icons";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    // Simple toggle between light and dark
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="size-8 px-0" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Icons.sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Icons.moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
