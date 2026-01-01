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
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { AuditLogEntry } from "@/actions/admin-audit-actions";

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  locale: string;
}

export function AuditLogTable({
  logs,
  currentPage,
  totalPages,
  totalCount,
  locale,
}: AuditLogTableProps) {
  const getActionTypeBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      user_created: "default",
      user_updated: "secondary",
      user_deleted: "destructive",
      plan_changed: "default",
      role_changed: "secondary",
    };

    return (
      <Badge variant={colors[actionType] as any || "outline"}>
        {actionType.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No audit log entries found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistance(new Date(log.created_at), new Date(), {
                    addSuffix: true,
                    locale: de,
                  })}
                </TableCell>
                <TableCell>
                  {log.admin_id ? (
                    <span className="font-mono text-xs">
                      {log.admin_id.substring(0, 8)}...
                    </span>
                  ) : (
                    <span className="text-muted-foreground">System</span>
                  )}
                </TableCell>
                <TableCell>{getActionTypeBadge(log.action_type)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{log.resource_type}</span>
                    {log.resource_id && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.resource_id.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {log.new_values && Object.keys(log.new_values).length > 0 ? (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View changes
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
                        {JSON.stringify(log.new_values, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, totalCount)} of {totalCount} entries
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${locale}/admin/audit?page=${Math.max(1, currentPage - 1)}`}
            >
              <Button variant="outline" size="sm" disabled={currentPage === 1}>
                <ChevronLeft className="size-4" />
                Previous
              </Button>
            </Link>
            <Link
              href={`/${locale}/admin/audit?page=${Math.min(totalPages, currentPage + 1)}`}
            >
              <Button variant="outline" size="sm" disabled={currentPage === totalPages}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

