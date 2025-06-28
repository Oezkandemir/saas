import { redirect } from "next/navigation";
import { User } from "@/types";

import { getCurrentUser } from "@/lib/session";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export const dynamic = "force-dynamic";

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
          <MaxWidthWrapper className="px-0">{children}</MaxWidthWrapper>
        </main>
      </div>
    </div>
  );
}
