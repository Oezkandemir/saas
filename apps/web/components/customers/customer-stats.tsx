"use client";

import { Calendar, Euro, FileText, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Customer } from "@/actions/customers-actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerStatsProps {
  customer: Customer;
  documents: Array<{
    id: string;
    type: "quote" | "invoice";
    status: string;
    total: number;
    document_date: string;
  }>;
}

export function CustomerStats({ customer, documents }: CustomerStatsProps) {
  const t = useTranslations("Customers.customerStats");
  const stats = useMemo(() => {
    const totalDocuments = documents.length;
    const quotes = documents.filter((d) => d.type === "quote");
    const invoices = documents.filter((d) => d.type === "invoice");
    const paidInvoices = invoices.filter((d) => d.status === "paid");
    const totalRevenue = paidInvoices.reduce(
      (sum, d) => sum + Number(d.total),
      0
    );
    const pendingAmount = invoices
      .filter((d) => d.status === "sent" || d.status === "overdue")
      .reduce((sum, d) => sum + Number(d.total), 0);

    // Calculate days since creation
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(customer.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return {
      totalDocuments,
      quotes: quotes.length,
      invoices: invoices.length,
      paidInvoices: paidInvoices.length,
      totalRevenue,
      pendingAmount,
      daysSinceCreation,
    };
  }, [documents, customer.created_at]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("documents")}
          </CardTitle>
          <FileText className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          <p className="text-xs text-muted-foreground">
            {t("documentsDescription", {
              quotes: stats.quotes,
              invoices: stats.invoices,
            })}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("revenue")}</CardTitle>
          <Euro className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalRevenue.toLocaleString("de-DE", {
              style: "currency",
              currency: "EUR",
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("revenueDescription", { count: stats.paidInvoices })}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("pending")}</CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.pendingAmount.toLocaleString("de-DE", {
              style: "currency",
              currency: "EUR",
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("pendingDescription")}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("customerSince")}
          </CardTitle>
          <Calendar className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.daysSinceCreation}</div>
          <p className="text-xs text-muted-foreground">{t("days")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
