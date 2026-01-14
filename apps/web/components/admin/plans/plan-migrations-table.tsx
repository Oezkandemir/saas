"use client";

import type { PlanMigration } from "@/actions/admin-plan-actions";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PlanMigrationsTableProps {
  migrations: PlanMigration[];
}

export function PlanMigrationsTable({ migrations }: PlanMigrationsTableProps) {
  if (migrations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No plan migrations yet
      </div>
    );
  }

  const getMigrationTypeBadge = (type: string) => {
    switch (type) {
      case "upgrade":
        return <Badge variant="default">Upgrade</Badge>;
      case "downgrade":
        return <Badge variant="secondary">Downgrade</Badge>;
      case "sidegrade":
        return <Badge variant="outline">Sidegrade</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>From Plan</TableHead>
            <TableHead>To Plan</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {migrations.map((migration) => (
            <TableRow key={migration.id}>
              <TableCell className="font-mono text-xs">
                {migration.user_id.substring(0, 8)}...
              </TableCell>
              <TableCell>
                {getMigrationTypeBadge(migration.migration_type)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {migration.from_plan_id ? (
                  <span className="font-mono text-xs">
                    {migration.from_plan_id.substring(0, 8)}...
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs">
                  {migration.to_plan_id.substring(0, 8)}...
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistance(new Date(migration.migrated_at), new Date(), {
                  addSuffix: true,
                  locale: de,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
