"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { Document, DocumentType } from "@/actions/documents-actions";
import { DocumentsTable } from "@/components/documents/documents-table";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentsTabsProps {
  allDocuments: Document[];
  quotes: Document[];
  invoices: Document[];
}

export function DocumentsTabs({
  allDocuments,
  quotes,
  invoices,
}: DocumentsTabsProps) {
  const t = useTranslations("Documents.tabs");
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const [activeTab, setActiveTab] = useState<DocumentType | "all">(
    typeParam === "quote" || typeParam === "invoice" ? typeParam : "all"
  );

  // Update active tab when URL changes (e.g., browser back/forward or initial load)
  useEffect(() => {
    const newType = (
      typeParam === "quote" || typeParam === "invoice" ? typeParam : "all"
    ) as DocumentType | "all";
    setActiveTab(newType);
  }, [typeParam]);

  const documents = useMemo(() => {
    return activeTab === "all"
      ? allDocuments
      : allDocuments.filter((d) => d.type === activeTab);
  }, [activeTab, allDocuments]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as DocumentType | "all");

    // Update URL silently using history API (no navigation, no POST requests)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (value === "all") {
        params.delete("type");
      } else {
        params.set("type", value);
      }

      const queryString = params.toString();
      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      // Use replaceState to update URL without triggering navigation
      window.history.replaceState({ ...window.history.state }, "", newUrl);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="all">{t("all")}</TabsTrigger>
        <TabsTrigger value="quote">
          {t("quotes", { count: quotes.length })}
        </TabsTrigger>
        <TabsTrigger value="invoice">
          {t("invoices", { count: invoices.length })}
        </TabsTrigger>
      </TabsList>
      <TabsContent value={activeTab} className="mt-6">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon name="post" />
              <EmptyPlaceholder.Title>
                {t("empty.title")}
              </EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                {t("empty.description")}
              </EmptyPlaceholder.Description>
              <div className="flex gap-2 mt-4">
                <Link href="/dashboard/documents/new?type=quote">
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 size-4" />
                    {t("empty.createQuote")}
                  </Button>
                </Link>
                <Link href="/dashboard/documents/new?type=invoice">
                  <Button size="sm">
                    <Plus className="mr-2 size-4" />
                    {t("empty.createInvoice")}
                  </Button>
                </Link>
              </div>
            </EmptyPlaceholder>
          </div>
        ) : (
          <DocumentsTable documents={documents} />
        )}
      </TabsContent>
    </Tabs>
  );
}
