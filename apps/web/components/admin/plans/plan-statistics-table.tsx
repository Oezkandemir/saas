"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlanStatistics } from "@/actions/admin-plan-actions";

interface PlanStatisticsTableProps {
  statistics: PlanStatistics[];
}

export function PlanStatisticsTable({ statistics }: PlanStatisticsTableProps) {
  if (statistics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Keine Plan-Statistiken verfügbar
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead className="text-right">Abonnenten</TableHead>
          <TableHead className="text-right">MRR</TableHead>
          <TableHead className="text-right">ARR</TableHead>
          <TableHead className="text-right">Gesamt Umsatz</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statistics.map((stat) => (
          <TableRow key={stat.plan_id}>
            <TableCell className="font-medium">
              <div className="flex flex-col">
                <span>{stat.plan_title}</span>
                <span className="text-xs text-muted-foreground">
                  {stat.plan_key}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              {stat.user_count}
            </TableCell>
            <TableCell className="text-right font-semibold">
              €{Number(stat.mrr || 0).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </TableCell>
            <TableCell className="text-right font-semibold">
              €{Number(stat.arr || 0).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </TableCell>
            <TableCell className="text-right font-semibold">
              €{Number(stat.total_revenue || 0).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}





