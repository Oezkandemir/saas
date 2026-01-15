"use client";

import { Building2, Mail, Phone } from "lucide-react";
import { useState } from "react";
import type { Customer } from "@/actions/customers-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import { CustomerDrawer } from "./customer-drawer";

interface CustomersMobileListProps {
  customers: Customer[];
}

export function CustomersMobileList({ customers }: CustomersMobileListProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="space-y-3">
        {customers.map((customer) => (
          <Card
            key={customer.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleCustomerClick(customer.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{customer.name}</p>
                  {customer.company && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Building2 className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {customer.company}
                      </span>
                    </div>
                  )}
                </div>
                {customer.qr_code && (
                  <Badge variant="secondary" className="text-xs font-mono shrink-0">
                    {customer.qr_code}
                  </Badge>
                )}
              </div>
              {(customer.email || customer.phone) && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      <CustomerDrawer
        customerId={selectedCustomerId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
