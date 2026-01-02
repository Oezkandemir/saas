"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from '@/components/alignui/actions/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from '@/components/alignui/forms/input';
import { Icons } from "@/components/shared/icons";

interface DocsSearchProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DocsSearch({ className, ...props }: DocsSearchProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function handleSearchClick() {
    setOpen(true);
  }

  return (
    <div className={cn("relative w-full", className)} {...props}>
      {/* Mobile: Only show search icon */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={handleSearchClick}
        aria-label="Search documentation"
      >
        <Icons.search className="size-4" />
      </Button>

      {/* Desktop: Show full search input */}
      <Button
        variant="outline"
        className="relative h-8 w-full justify-start bg-muted/50 text-sm font-normal text-muted-foreground shadow-none hidden lg:flex sm:w-64 sm:pr-12"
        onClick={handleSearchClick}
      >
        <span className="inline-flex">Search documentation...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search documentation..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Documentation">
            <CommandItem>
              <Icons.arrowRight className="mr-2 size-4" />
              Getting Started
            </CommandItem>
            <CommandItem>
              <Icons.settings className="mr-2 size-4" />
              Configuration
            </CommandItem>
            <CommandItem>
              <Icons.arrowRight className="mr-2 size-4" />
              Theming
            </CommandItem>
            <CommandItem>
              <Icons.arrowRight className="mr-2 size-4" />
              Components
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
