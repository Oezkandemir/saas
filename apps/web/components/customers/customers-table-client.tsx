"use client";

import { useState } from "react";
import type { Customer } from "@/actions/customers-actions";
import { Building2, Mail, Phone } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import { CustomerDrawer } from "./customer-drawer";

interface CustomersTableClientProps {
  customers: Customer[];
}

export function CustomersTableClient({ customers }: CustomersTableClientProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-10 text-xs font-medium">Name</TableHead>
              <TableHead className="h-10 text-xs font-medium">Contact</TableHead>
              <TableHead className="h-10 text-xs font-medium">Company</TableHead>
              <TableHead className="h-10 text-xs font-medium">QR Code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => handleCustomerClick(customer.id)}
              >
                <TableCell className="py-2.5">
                  <span className="text-sm font-medium hover:text-primary transition-colors">
                    {customer.name}
                  </span>
                </TableCell>
                <TableCell className="py-2.5">
                  <div className="flex flex-col gap-0.5">
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">
                          {customer.email}
                        </span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {!customer.email && !customer.phone && (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2.5 text-sm text-muted-foreground">
                  {customer.company ? (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      <span>{customer.company}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="py-2.5">
                  {customer.qr_code ? (
                    <Badge variant="secondary" className="text-xs font-mono">
                      {customer.qr_code}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CustomerDrawer
        customerId={selectedCustomerId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}

