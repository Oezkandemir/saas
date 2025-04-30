import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfigureStripePortalButton } from "@/components/admin/configure-stripe-button";
import { PageHeader } from "@/components/page-header";

export default async function AdminPanelPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Simple admin check based on email pattern - replace with a more robust method later
  const isAdmin = session.user.email.endsWith("@admin.com");
  
  if (!isAdmin) {
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
