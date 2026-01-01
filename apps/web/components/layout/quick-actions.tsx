"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, FileText, QrCode, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function QuickActions() {
  const router = useRouter();
  const t = useTranslations("QuickActions");
  const [open, setOpen] = useState(false);

  // Keyboard shortcut: "N" to open quick actions
  useKeyboardShortcuts([
    {
      key: "n",
      handler: () => setOpen(true),
    },
  ]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("new")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("createNew")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/documents/new?type=quote")}
        >
          <FileText className="mr-2 h-4 w-4" />
          {t("newQuote")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/documents/new?type=invoice")}
        >
          <FileText className="mr-2 h-4 w-4" />
          {t("newInvoice")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/customers/new")}
        >
          <Users className="mr-2 h-4 w-4" />
          {t("newCustomer")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/qr-codes/new")}
        >
          <QrCode className="mr-2 h-4 w-4" />
          {t("newQRCode")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

