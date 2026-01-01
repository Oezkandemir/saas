"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PlanStatistics } from "@/actions/admin-plan-actions";

interface PlanStatisticsTableProps {
  statistics: PlanStatistics[];
}

export function PlanStatisticsTable({ statistics }: PlanStatisticsTableProps) {
  if (statistics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No plan statistics available
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead className="text-right">Users</TableHead>
            <TableHead className="text-right">MRR</TableHead>
            <TableHead className="text-right">ARR</TableHead>
            <TableHead className="text-right">Total Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statistics.map((stat) => (
            <TableRow key={stat.plan_id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{stat.plan_title}</span>
                  <span className="text-xs text-muted-foreground">
                    {stat.plan_key}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{stat.user_count}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                €{Number(stat.mrr || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium">
                €{Number(stat.arr || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium">
                €{Number(stat.total_revenue || 0).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

