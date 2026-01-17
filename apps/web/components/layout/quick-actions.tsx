"use client";

import { FileText, Plus, QrCode, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuRoot as DropdownMenu,
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
        <Button size="icon" className="size-9">
          <Plus className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("createNew")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/documents/new?type=quote")}
        >
          <FileText className="mr-2 size-4" />
          {t("newQuote")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/documents/new?type=invoice")}
        >
          <FileText className="mr-2 size-4" />
          {t("newInvoice")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/customers/new")}
        >
          <Users className="mr-2 size-4" />
          {t("newCustomer")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/qr-codes/new")}
        >
          <QrCode className="mr-2 size-4" />
          {t("newQRCode")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
