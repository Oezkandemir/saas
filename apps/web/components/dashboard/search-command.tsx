"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SidebarNavItem } from "@/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Icons } from "@/components/shared/icons";

// Fallback translations in case context is not available
const fallbackTranslations = {
  label: "Search",
  placeholder: "Search...",
  inputPlaceholder: "Type a command or search...",
  noResults: "No results found.",
};

// Wrapper component that safely uses translations
// This component will always call useTranslations hook (required by Rules of Hooks)
// The Error Boundary will catch any errors if context is not available
function SearchCommandWithTranslations({ links }: { links: SidebarNavItem[] }) {
  const t = useTranslations("Search");
  return <SearchCommandContent links={links} t={t} />;
}

function SearchCommandContent({ links, t }: { links: SidebarNavItem[]; t: (key: string) => string }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Skip if input/textarea/contenteditable is focused
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // cmd+k or ctrl+k to open search
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // "/" to focus search
      if (e.key === "/" && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const handleItemSelect = React.useCallback(
    (href: string) => {
      runCommand(() => router.push(href));
    },
    [runCommand, router],
  );

  return (
    <>
      {/* Mobile: Only show search icon */}
      <Button
        variant="outline"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label={t("label")}
      >
        <Icons.search className="size-4" />
      </Button>

      {/* Desktop: Show full search bar */}
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none pr-12 hidden sm:flex md:w-72",
        )}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex">
          {t("placeholder")}
        </span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.45rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("inputPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("noResults")}</CommandEmpty>
          {links.map((section) => (
            <CommandGroup key={section.title} heading={section.title}>
              {section.items.map((item) => {
                const Icon = Icons[item.icon || "arrowRight"];
                return (
                  <CommandItem
                    key={item.title}
                    onSelect={() => handleItemSelect(item.href as string)}
                    onClick={() => handleItemSelect(item.href as string)}
                  >
                    <Icon className="mr-2 size-5" />
                    {item.title}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Fallback component when translations are not available
function SearchCommandFallback() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "/" && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label={fallbackTranslations.label}
      >
        <Icons.search className="size-4" />
      </Button>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none pr-12 hidden sm:flex md:w-72",
        )}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex">
          {fallbackTranslations.placeholder}
        </span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.45rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={fallbackTranslations.inputPlaceholder} />
        <CommandList>
          <CommandEmpty>{fallbackTranslations.noResults}</CommandEmpty>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Error boundary component
class TranslationErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if error is related to missing NextIntl context
    const isNextIntlError = 
      error.message?.includes("NextIntlClientProvider") ||
      error.message?.includes("useTranslations") ||
      error.message?.includes("context");
    
    if (isNextIntlError) {
      return { hasError: true, error };
    }
    // Re-throw other errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.warn("Translation context error caught:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Main export with error boundary
export function SearchCommand({ links }: { links: SidebarNavItem[] }) {
  return (
    <TranslationErrorBoundary fallback={<SearchCommandFallback />}>
      <SearchCommandWithTranslations links={links} />
    </TranslationErrorBoundary>
  );
}
