"use client";

import { useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from "@tanstack/react-query";

interface QueryClientProviderProps {
  children: ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh (increased from 5)
            gcTime: 30 * 60 * 1000, // 30 minutes - cache retention (increased from 10)
            refetchOnWindowFocus: false, // Only refetch when needed
            refetchOnReconnect: true, // Refetch when connection restored
            refetchOnMount: false, // Don't refetch if data is fresh
            retry: 1, // Retry failed requests once
            // Use stale-while-revalidate strategy for better UX
            refetchInterval: false, // Disable automatic refetching by default
          },
          mutations: {
            retry: 1, // Retry failed mutations once
          },
        },
      }),
  );

  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
    </ReactQueryClientProvider>
  );
}
