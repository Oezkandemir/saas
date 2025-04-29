"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface DocsLanguageProviderProps {
  children: ReactNode;
}

export function DocsLanguageProvider({ children }: DocsLanguageProviderProps) {
  // This component doesn't do much on its own, but it ensures that React context providers
  // for hooks (like useTranslations) are properly initialized on the client side
  const t = useTranslations("Navigation");
  
  return <>{children}</>;
} 