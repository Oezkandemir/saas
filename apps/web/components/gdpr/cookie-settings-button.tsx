"use client";

import { Cookie } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { CookieConsent } from "./cookie-consent";

export function CookieSettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
      >
        <Cookie className="mr-2 size-4" />
        Cookie-Einstellungen ändern
      </Button>
      <CookieConsent autoShow={false} open={open} onOpenChange={setOpen} />
    </>
  );
}
