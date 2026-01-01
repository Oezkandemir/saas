"use client";

import { Phone, Mail, MessageSquare, FileText, Calendar, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Customer } from "@/actions/customers-actions";
import { SendEmailDialog } from "./send-email-dialog";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

interface CustomerQuickActionsProps {
  customer: Customer;
}

export function CustomerQuickActions({ customer }: CustomerQuickActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCall = () => {
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    } else {
      toast.error("Keine Telefonnummer vorhanden");
    }
  };

  const handleCopyEmail = async () => {
    if (customer.email) {
      await navigator.clipboard.writeText(customer.email);
      setCopied(true);
      toast.success("E-Mail-Adresse kopiert");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg border">
      {customer.email && (
        <>
          <SendEmailDialog
            customer={customer}
            trigger={
              <Button variant="default" size="sm" className="gap-2">
                <Mail className="h-4 w-4" />
                E-Mail senden
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyEmail}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Kopiert
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                E-Mail kopieren
              </>
            )}
          </Button>
        </>
      )}

      {customer.phone && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCall}
          className="gap-2"
        >
          <Phone className="h-4 w-4" />
          Anrufen
        </Button>
      )}

      <Link href={`/dashboard/documents/new?type=quote&customer_id=${customer.id}`}>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Neues Angebot
        </Button>
      </Link>

      <Link href={`/dashboard/documents/new?type=invoice&customer_id=${customer.id}`}>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Neue Rechnung
        </Button>
      </Link>
    </div>
  );
}

