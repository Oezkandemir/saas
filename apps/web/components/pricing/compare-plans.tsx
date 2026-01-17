import { Check, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { comparePlans, plansColumns } from "@/config/subscriptions";
import { cn } from "@/lib/utils";
import type { PlansRow } from "@/types";

export function ComparePlans() {
  const t = useTranslations("ComparePlans");
  const tFeatures = useTranslations("Pricing.features");

  // Feature name mapping from config to translation keys
  const featureKeyMap: Record<string, string> = {
    Kunden: "customers",
    "QR-Codes": "qrCodes",
    "Dokumente pro Monat": "documentsPerMonth",
    "PDF-Export": "pdfExport",
    Statusverwaltung: "statusManagement",
    "Angebot zu Rechnung": "quoteToInvoice",
    "QR-Code Scan-Tracking": "qrCodeScanTracking",
    "Custom QR Alias": "customQrAlias",
    "Eigenes Logo & Footer": "customLogoFooter",
    "Priority Support": "prioritySupport",
    "API-Zugang": "apiAccess",
    "Cenety Branding": "cenetyBranding",
  };

  // Translate features dynamically
  const translatedPlans = comparePlans.map((row) => {
    const featureKey =
      featureKeyMap[row.feature] ||
      row.feature.toLowerCase().replace(/\s+/g, "");
    const translatedRow: PlansRow = {
      ...row,
      feature: tFeatures(featureKey),
    };
    if (row.tooltip) {
      translatedRow.tooltip = tFeatures(`${featureKey}Tooltip`);
    }
    return translatedRow;
  });

  const renderCell = (value: string | boolean | null, col: string) => {
    if (value === null)
      return <span className="text-muted-foreground/50">—</span>;
    if (typeof value === "boolean") {
      return value ? (
        <div className="flex items-center justify-center">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="size-4" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="flex size-6 items-center justify-center rounded-full bg-muted">
            <X className="size-3 text-muted-foreground" />
          </div>
        </div>
      );
    }
    return (
      <span
        className={cn(
          "font-medium",
          col === "pro" && "text-primary",
          col === "enterprise" && "text-primary"
        )}
      >
        {value}
      </span>
    );
  };

  const getPlanBadge = (col: string) => {
    if (col === "pro")
      return (
        <Badge className="bg-primary text-primary-foreground">
          {t("popular")}
        </Badge>
      );
    if (col === "enterprise")
      return <Badge variant="secondary">{t("premium")}</Badge>;
    return null;
  };

  return (
    <MaxWidthWrapper>
      {/* Header */}
      <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-4">
          {t("compare")}
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
          {t("comparePlans")}
        </h2>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          {t("findPerfectPlan")}
        </p>
      </div>

      {/* Comparison Table - Modern Card Layout */}
      <div className="my-10 grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        {plansColumns.map((col) => (
          <div
            key={col}
            className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Plan Header */}
            <div className="border-b bg-muted/30 p-5 text-center">
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-xl font-bold capitalize">{col}</h3>
                {getPlanBadge(col) && (
                  <div className="mt-1">{getPlanBadge(col)}</div>
                )}
              </div>
            </div>

            {/* Features List */}
            <div className="divide-y">
              {translatedPlans.map((row: PlansRow, index: number) => (
                <div
                  key={index}
                  className="p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {row.feature}
                        </span>
                        {row.tooltip && (
                          <Popover>
                            <PopoverTrigger className="shrink-0 rounded p-0.5 hover:bg-muted transition-colors">
                              <Info className="size-3.5 text-muted-foreground" />
                            </PopoverTrigger>
                            <PopoverContent
                              side="top"
                              className="max-w-80 p-3 text-sm"
                            >
                              {row.tooltip}
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {renderCell(
                        typeof row[col] === "string" &&
                          (row[col] === "Unbegrenzt" ||
                            row[col] === "Unlimited" ||
                            row[col] === "3")
                          ? row[col] === "3"
                            ? row[col]
                            : tFeatures("unlimited")
                          : (row[col] ?? null),
                        col
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MaxWidthWrapper>
  );
}
