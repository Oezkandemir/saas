"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface AuditLogFiltersProps {
  locale: string;
  currentFilters: {
    action_type?: string;
    resource_type?: string;
    admin_id?: string;
  };
}

export function AuditLogFilters({ locale, currentFilters }: AuditLogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [actionType, setActionType] = useState(currentFilters.action_type || "all");
  const [resourceType, setResourceType] = useState(currentFilters.resource_type || "all");
  const [adminId, setAdminId] = useState(currentFilters.admin_id || "");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (actionType && actionType !== "all") params.set("action_type", actionType);
    if (resourceType && resourceType !== "all") params.set("resource_type", resourceType);
    if (adminId) params.set("admin_id", adminId);
    params.set("page", "1");
    router.push(`/${locale}/admin/audit?${params.toString()}`);
  };

  const clearFilters = () => {
    setActionType("all");
    setResourceType("all");
    setAdminId("");
    router.push(`/${locale}/admin/audit`);
  };

  const hasActiveFilters = (actionType && actionType !== "all") || (resourceType && resourceType !== "all") || adminId;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex gap-2 items-center text-sm">
          <Filter className="size-4 text-primary" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Action Type</label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="user_created">User Created</SelectItem>
                <SelectItem value="user_updated">User Updated</SelectItem>
                <SelectItem value="user_deleted">User Deleted</SelectItem>
                <SelectItem value="plan_changed">Plan Changed</SelectItem>
                <SelectItem value="role_changed">Role Changed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Resource Type</label>
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger>
                <SelectValue placeholder="All resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All resources</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="plan">Plan</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Admin ID</label>
            <Input
              placeholder="Filter by admin ID..."
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={applyFilters}>
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={clearFilters}>
              <X className="size-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

