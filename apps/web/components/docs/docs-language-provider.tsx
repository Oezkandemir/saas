"use client";

import { ReactNode } from "react";

interface DocsLanguageProviderProps {
  children: ReactNode;
}

export function DocsLanguageProvider({ children }: DocsLanguageProviderProps) {
  // This component doesn't do much on its own, but it ensures that React context providers
  // for hooks (like useTranslations) are properly initialized on the client side

  return <>{children}</>;
}
