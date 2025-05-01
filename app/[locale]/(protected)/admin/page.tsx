import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfigureStripePortalButton } from "@/components/admin/configure-stripe-button";
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header";
import { getCurrentUser } from "@/lib/session";
import { MessageSquare, Users } from "lucide-react";

export default async function AdminPanelPage() {
  const user = await getCurrentUser();
  if (!user?.email) {
    redirect("/login");
  }

  // Check for ADMIN role instead of email pattern
  const isAdmin = user.role === "ADMIN";
  
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div>
      <PageHeader>
        <PageHeaderHeading>Admin Panel</PageHeaderHeading>
        <PageHeaderDescription>Manage your application settings and users</PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 size-5" />
              Users Management
            </CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 size-5" />
              Support Tickets
            </CardTitle>
            <CardDescription>
              Manage support requests from your users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/support">
              <Button>Manage Support Tickets</Button>
            </Link>
          </CardContent>
        </Card>

        <ConfigureStripePortalButton />
      </div>
    </div>
  );
}
