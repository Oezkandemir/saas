import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDocuments } from "@/actions/documents-actions";
import { Button } from "@/components/ui/button";
import { Plus, FileText, FileCheck, FileX, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DocumentsTabs } from "@/components/documents/documents-tabs";
import { PlanLimitWarning } from "@/components/plan-limit-warning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allDocuments = await getDocuments().catch(() => []);
  const quotes = allDocuments.filter((d) => d.type === "quote");
  const invoices = allDocuments.filter((d) => d.type === "invoice");
  const draftQuotes = quotes.filter((d) => d.status === "draft");
  const sentQuotes = quotes.filter((d) => d.status === "sent");
  const paidInvoices = invoices.filter((d) => d.status === "paid");
  const unpaidInvoices = invoices.filter((d) => d.status !== "paid");

  const stats = [
    {
      title: "Gesamt Dokumente",
      value: allDocuments.length,
      icon: FileText,
      gradient: "from-indigo-500/20 to-blue-500/20",
      iconGradient: "from-indigo-500 to-blue-500",
      description: `${quotes.length} Angebote, ${invoices.length} Rechnungen`,
    },
    {
      title: "Offene Angebote",
      value: draftQuotes.length + sentQuotes.length,
      icon: FileText,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconGradient: "from-blue-500 to-cyan-500",
      description: `${draftQuotes.length} Entwurf, ${sentQuotes.length} Gesendet`,
    },
    {
      title: "Bezahlte Rechnungen",
      value: paidInvoices.length,
      icon: FileCheck,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconGradient: "from-emerald-500 to-teal-500",
      description: `${Math.round((paidInvoices.length / Math.max(invoices.length, 1)) * 100)}% Erfolgsrate`,
    },
    {
      title: "Unbezahlte Rechnungen",
      value: unpaidInvoices.length,
      icon: FileX,
      gradient: "from-orange-500/20 to-red-500/20",
      iconGradient: "from-orange-500 to-red-500",
      description: unpaidInvoices.length > 0 ? "Aktion erforderlich" : "Alles erledigt",
    },
  ];

  return (
    <div className="relative flex flex-col gap-6">
      {/* Animated background decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-indigo-500/10 to-blue-500/10 blur-3xl delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Plan Limit Warning */}
      <PlanLimitWarning userId={user.id} limitType="documents" />

      {/* Header */}
      <ModernPageHeader
        title="Dokumente"
        description="Verwalten Sie Ihre Angebote und Rechnungen. Erstellen Sie professionelle Dokumente in Minuten."
        icon={<FileText className="h-5 w-5 text-primary" />}
        actions={
          <>
            <Link href="/dashboard/documents/new?type=quote">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Angebot
              </Button>
            </Link>
            <Link href="/dashboard/documents/new?type=invoice">
              <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="h-4 w-4" />
                Rechnung
              </Button>
            </Link>
          </>
        }
      />

      {/* Statistics */}
      {allDocuments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={cn(
                  "group relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4",
                  stat.gradient
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient background on hover */}
                <div className={cn("absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", stat.gradient)} />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={cn("flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110", stat.iconGradient)}>
                    <Icon className="size-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <TrendingUp className="size-3" />
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {stat.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Documents Tabs */}
      <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />

        <CardContent className="p-0">
          <DocumentsTabs
            allDocuments={allDocuments}
            quotes={quotes}
            invoices={invoices}
          />
        </CardContent>
      </Card>
    </div>
  );
}

