"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  FileText,
  Home,
  Loader2,
  QrCode,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/alignui/forms/input";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  href: string;
  category: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // All available commands/pages
  const allItems: SearchResult[] = [
    // Navigation
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Zurück zur Übersicht",
      icon: <Home className="h-4 w-4" />,
      href: "/dashboard",
      category: "Navigation",
    },
    {
      id: "customers",
      title: "Kunden",
      description: "Kundenverwaltung öffnen",
      icon: <Users className="h-4 w-4" />,
      href: "/dashboard/customers",
      category: "Navigation",
    },
    {
      id: "documents",
      title: "Dokumente",
      description: "Angebote und Rechnungen",
      icon: <FileText className="h-4 w-4" />,
      href: "/dashboard/documents",
      category: "Navigation",
    },
    {
      id: "qr-codes",
      title: "QR-Codes",
      description: "QR-Code Verwaltung",
      icon: <QrCode className="h-4 w-4" />,
      href: "/dashboard/qr-codes",
      category: "Navigation",
    },
    {
      id: "settings",
      title: "Einstellungen",
      description: "Account-Einstellungen",
      icon: <Settings className="h-4 w-4" />,
      href: "/dashboard/settings",
      category: "Navigation",
    },
    {
      id: "billing",
      title: "Abrechnung",
      description: "Abonnement verwalten",
      icon: <CreditCard className="h-4 w-4" />,
      href: "/dashboard/billing",
      category: "Navigation",
    },
    {
      id: "company",
      title: "Unternehmensprofile",
      description: "Firmendaten verwalten",
      icon: <Building2 className="h-4 w-4" />,
      href: "/dashboard/settings/company",
      category: "Navigation",
    },
    // Actions
    {
      id: "new-customer",
      title: "Neuer Kunde",
      description: "Kunden erstellen",
      icon: <Users className="h-4 w-4" />,
      href: "/dashboard/customers/new",
      category: "Aktionen",
    },
    {
      id: "new-document",
      title: "Neues Dokument",
      description: "Angebot oder Rechnung erstellen",
      icon: <FileText className="h-4 w-4" />,
      href: "/dashboard/documents/new",
      category: "Aktionen",
    },
    {
      id: "new-qr",
      title: "Neuer QR-Code",
      description: "QR-Code generieren",
      icon: <QrCode className="h-4 w-4" />,
      href: "/dashboard/qr-codes/new",
      category: "Aktionen",
    },
  ];

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      if (open) {
        if (e.key === "Escape") {
          setOpen(false);
        }

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % results.length);
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + results.length) % results.length);
        }

        if (e.key === "Enter") {
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, results, selectedIndex]);

  // Search logic
  useEffect(() => {
    if (!search) {
      setResults(allItems);
      setSelectedIndex(0);
      return;
    }

    setIsSearching(true);
    const searchLower = search.toLowerCase();

    // Simple fuzzy search
    const filtered = allItems.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(searchLower);
      const descMatch = item.description?.toLowerCase().includes(searchLower);
      const categoryMatch = item.category.toLowerCase().includes(searchLower);
      return titleMatch || descMatch || categoryMatch;
    });

    // Sort by relevance (title matches first)
    filtered.sort((a, b) => {
      const aTitle = a.title.toLowerCase().startsWith(searchLower);
      const bTitle = b.title.toLowerCase().startsWith(searchLower);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });

    setResults(filtered);
    setSelectedIndex(0);
    setIsSearching(false);
  }, [search]);

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    setSearch("");
    router.push(item.href);
  };

  // Group results by category
  const groupedResults = results.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, SearchResult[]>,
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:w-64"
      >
        <Search className="h-4 w-4" />
        <span>Suche...</span>
        <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <div className="flex items-center border-b px-4 py-3">
            <Search className="mr-2 h-5 w-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Seiten, Kunden, Dokumenten..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Keine Ergebnisse gefunden
              </div>
            ) : (
              Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <div className="mb-1 px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {items.map((item) => {
                    const globalIndex = results.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${
                          globalIndex === selectedIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Verwende ↑↓ zum Navigieren</span>
              <span>↵ zum Öffnen</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
