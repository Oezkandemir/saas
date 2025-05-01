export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { getCurrentUser } from "@/lib/session";
import { User } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div>Dashboard</div>
          <div>{user.email}</div>
        </div>
      </header>
      <div className="container flex-1">
        <main className="flex w-full flex-col overflow-hidden pt-8">
          <MaxWidthWrapper className="px-0">
            {children}
          </MaxWidthWrapper>
        </main>
      </div>
    </div>
  );
} 