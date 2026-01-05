import { PlansRow } from "@/types";
import { Check, Info, X } from "lucide-react";

import { comparePlans, plansColumns } from "@/config/subscriptions";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export function ComparePlans() {
  const renderCell = (value: string | boolean | null, col: string) => {
    if (value === null)
      return <span className="text-muted-foreground/50">—</span>;
    if (typeof value === "boolean") {
      return value ? (
        <div className="flex items-center justify-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <X className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      );
    }
    return (
      <span
        className={cn(
          "font-medium",
          col === "pro" && "text-primary",
          col === "enterprise" && "text-primary",
        )}
      >
        {value}
      </span>
    );
  };

  const getPlanBadge = (col: string) => {
    if (col === "pro")
      return (
        <Badge className="bg-primary text-primary-foreground">Beliebt</Badge>
      );
    if (col === "enterprise") return <Badge variant="secondary">Premium</Badge>;
    return null;
  };

  return (
    <MaxWidthWrapper>
      {/* Header */}
      <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-4">
          Vergleich
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
          Pläne vergleichen
        </h2>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          Finden Sie den perfekten Plan für Ihre Bedürfnisse!
        </p>
      </div>

      {/* Comparison Table */}
      <div className="my-10 overflow-x-auto rounded-xl border bg-card shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="min-w-full">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="sticky left-0 z-20 w-48 bg-muted/50 p-5 text-left md:w-1/3 lg:top-14">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Features
                  </span>
                </th>
                {plansColumns.map((col) => (
                  <th
                    key={col}
                    className="sticky z-10 w-32 bg-muted/50 p-5 text-center font-heading text-lg capitalize tracking-wide md:w-auto lg:top-14 lg:text-xl"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span>{col}</span>
                      {getPlanBadge(col)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {comparePlans.map((row: PlansRow, index: number) => (
                <tr key={index} className="transition-colors hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium lg:text-base">
                        {row.feature}
                      </span>
                      {row.tooltip && (
                        <Popover>
                          <PopoverTrigger className="shrink-0 rounded p-1 hover:bg-muted transition-colors">
                            <Info className="h-4 w-4 text-muted-foreground" />
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
                  </td>
                  {plansColumns.map((col) => (
                    <td
                      key={col}
                      className="p-4 text-center text-sm lg:text-base"
                    >
                      {renderCell(row[col], col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
