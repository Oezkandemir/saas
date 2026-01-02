import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const user = await getCurrentUser();
  const locale = await getLocale();

  // OPTIMIZATION: Only redirect if user is authenticated
  // Don't redirect if already on target page to prevent loops
  if (user) {
    if (user.role === "ADMIN") {
      redirect(`/${locale}/admin`);
    } else {
      redirect(`/${locale}/dashboard`);
    }
  }

  return (
    <div className="min-h-screen" style={{ scrollBehavior: "auto" }}>
      {children}
    </div>
  );
}
