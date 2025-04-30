import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { isAdmin } from "@/lib/utils";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfigureStripePortalButton } from "@/components/admin/configure-stripe-button";

export default async function AdminPanelPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  });

  if (!user || !isAdmin(user)) {
    redirect("/dashboard");
  }

  return (
    <div>
      <PageHeader
        heading="Admin Panel"
        subheading="Manage your application settings and users"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>
              View and manage users in your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button>Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <ConfigureStripePortalButton />
      </div>
    </div>
  );
}
