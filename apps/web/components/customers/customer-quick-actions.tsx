"use client";

import { Check, Copy, FileText, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer } from "@/actions/customers-actions";

import { Button } from "@/components/ui/button";

import { SendEmailDialog } from "./send-email-dialog";

interface CustomerQuickActionsProps {
  customer: Customer;
}

export function CustomerQuickActions({ customer }: CustomerQuickActionsProps) {
  const t = useTranslations("Customers.quickActions");
  const [copied, setCopied] = useState(false);

  const handleCall = () => {
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    } else {
      toast.error(t("toast.noPhone"));
    }
  };

  const handleCopyEmail = async () => {
    if (customer.email) {
      await navigator.clipboard.writeText(customer.email);
      setCopied(true);
      toast.success(t("toast.emailCopied"));
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
                <Mail className="size-4" />
                {t("sendEmail")}
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
                <Check className="size-4" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="size-4" />
                {t("copyEmail")}
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
          <Phone className="size-4" />
          {t("call")}
        </Button>
      )}

      <Link
        href={`/dashboard/documents/new?type=quote&customer_id=${customer.id}`}
      >
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="size-4" />
          {t("newQuote")}
        </Button>
      </Link>

      <Link
        href={`/dashboard/documents/new?type=invoice&customer_id=${customer.id}`}
      >
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="size-4" />
          {t("newInvoice")}
        </Button>
      </Link>
    </div>
  );
}
