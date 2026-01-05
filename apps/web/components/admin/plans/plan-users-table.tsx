"use client";

import type { PlanUser } from "@/actions/admin-plan-actions";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
} from "@/components/alignui/data-display/avatar";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";

interface PlanUsersTableProps {
  users: PlanUser[];
}

export function PlanUsersTable({ users }: PlanUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Keine User mit aktiven Subscriptions gefunden
      </div>
    );
  }

  // Group users by plan
  const usersByPlan = users.reduce(
    (acc, user) => {
      const planKey = user.plan_key || "unassigned";
      if (!acc[planKey]) {
        acc[planKey] = {
          plan_title: user.plan_title || "Nicht zugeordnet",
          plan_key: planKey,
          users: [],
        };
      }
      acc[planKey].users.push(user);
      return acc;
    },
    {} as Record<
      string,
      { plan_title: string; plan_key: string; users: PlanUser[] }
    >,
  );

  return (
    <div className="space-y-6">
      {Object.values(usersByPlan).map((planGroup) => (
        <div key={planGroup.plan_key} className="rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{planGroup.plan_title}</h3>
              <Badge variant="secondary">{planGroup.users.length} User</Badge>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Price ID</TableHead>
                <TableHead>Subscription ID</TableHead>
                <TableHead>Läuft ab</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planGroup.users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.user_name
                            ? user.user_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : user.user_email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {user.user_name || "Unbekannt"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.user_email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.user_role === "ADMIN" ? "default" : "secondary"
                      }
                    >
                      {user.user_role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {user.polar_product_id ? (
                      <span className="text-muted-foreground">
                        {user.polar_product_id.slice(0, 20)}...
                      </span>
                    ) : user.stripe_price_id ? (
                      <span className="text-muted-foreground">
                        {user.stripe_price_id}
                      </span>
                    ) : (
                      <span className="text-destructive">Keine</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {user.polar_subscription_id ? (
                      <span className="text-muted-foreground">
                        {user.polar_subscription_id.slice(0, 20)}...
                      </span>
                    ) : user.stripe_subscription_id ? (
                      <span className="text-muted-foreground">
                        {user.stripe_subscription_id.slice(0, 20)}...
                      </span>
                    ) : (
                      <span className="text-destructive">Keine</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.polar_current_period_end ? (
                      format(
                        new Date(user.polar_current_period_end),
                        "dd.MM.yyyy",
                        { locale: de },
                      )
                    ) : user.stripe_current_period_end ? (
                      format(
                        new Date(user.stripe_current_period_end),
                        "dd.MM.yyyy",
                        { locale: de },
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
