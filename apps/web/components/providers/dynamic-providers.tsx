"use client";

import dynamic from "next/dynamic";

// ⚡ PERFORMANCE: Dynamic imports for heavy components with SSR disabled
// These components are loaded after initial render to improve FCP and LCP
const Analytics = dynamic(
  () =>
    import("@/components/analytics").then((mod) => ({
      default: mod.Analytics,
    })),
  {
    ssr: false,
    loading: () => null, // Don't show loading state for analytics
  },
);

const ModalProvider = dynamic(() => import("@/components/modals/providers"), {
  ssr: false,
  loading: () => null, // Don't show loading state for modals
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
