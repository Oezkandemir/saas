"use client";

import dynamic from "next/dynamic";

// Dynamic imports for heavy components with SSR disabled
const Analytics = dynamic(() => import("@/components/analytics").then(mod => ({ default: mod.Analytics })), {
  ssr: false,
});

const ModalProvider = dynamic(() => import("@/components/modals/providers"), {
  ssr: false,
});

interface DynamicProvidersProps {
  children: React.ReactNode;
}

export function DynamicProviders({ children }: DynamicProvidersProps) {
  return (
    <>
      <ModalProvider>{children}</ModalProvider>
      <Analytics />
    </>
  );
}












