import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "ADMIN") redirect("/admin");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen" style={{ scrollBehavior: "auto" }}>
      {children}
    </div>
  );
}
