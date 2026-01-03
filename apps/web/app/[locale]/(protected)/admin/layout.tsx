import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  // Admin layout only renders children - the parent (protected) layout handles the sidebar
  // The sidebar links will be changed in the parent layout based on the path
  return <>{children}</>;
}
