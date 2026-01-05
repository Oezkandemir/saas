"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, QrCode, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Button } from "@/components/alignui/actions/button";
import {
  DropdownMenuRoot as DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/alignui/overlays/dropdown-menu";

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
        <Button size="icon" className="h-9 w-9">
          <Plus className="h-4 w-4" />
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
