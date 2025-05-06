import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfigureStripePortalButton } from "@/components/admin/configure-stripe-button";
import { DashboardHeader } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/session";
import { 
  MessageSquare, 
  Users, 
  Settings, 
  ShieldCheck, 
  CreditCard,
  BarChart4,
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";
import { getAllUsers } from "@/actions/admin-user-actions";
import { getAllTickets } from "@/actions/support-ticket-actions";

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

  // Fetch data for stats
  const usersResult = await getAllUsers();
  const ticketsResult = await getAllTickets();

  // Default values in case of errors
  let totalUsers = 0;
  let adminUsers = 0;
  let subscribedUsers = 0;
  let totalTickets = 0;
  let openTickets = 0;
  let inProgressTickets = 0;
  let resolvedTickets = 0;

  if (usersResult.success && usersResult.data) {
    const users = usersResult.data;
    totalUsers = users.length;
    adminUsers = users.filter(user => user.role === "ADMIN").length;
    subscribedUsers = users.filter(user => user.stripe_subscription_id).length;
  }

  if (ticketsResult.success && ticketsResult.data) {
    const tickets = ticketsResult.data;
    totalTickets = tickets.length;
    openTickets = tickets.filter(ticket => ticket.status === 'open').length;
    inProgressTickets = tickets.filter(ticket => ticket.status === 'in_progress').length;
    resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved' || ticket.status === 'closed').length;
  }

  return (
    <div className="container px-0 sm:px-4">
      <DashboardHeader
        heading="Admin Panel"
        text="Manage your application settings, users, and support tickets."
      />
      
      {/* User Stats Section */}
      <div className="my-6">
        <h2 className="mb-3 text-lg font-medium">User Statistics</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Users</p>
                <h3 className="mt-1 text-xl font-bold">{totalUsers}</h3>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
                <Users className="size-4 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-purple-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Admin Users</p>
                <h3 className="mt-1 text-xl font-bold">{adminUsers}</h3>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-purple-100">
                <ShieldCheck className="size-4 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-green-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Subscribers</p>
                <h3 className="mt-1 text-xl font-bold">{subscribedUsers}</h3>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
                <CreditCard className="size-4 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-indigo-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Open Tickets</p>
                <h3 className="mt-1 text-xl font-bold">{openTickets}</h3>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100">
                <MessageSquare className="size-4 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Support Ticket Stats Section */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Support Ticket Status</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Card className="overflow-hidden border-l-4 border-l-amber-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">New Tickets</p>
                <h3 className="mt-1 text-xl font-bold">{openTickets}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Awaiting response</p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="size-4 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-orange-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                <h3 className="mt-1 text-xl font-bold">{inProgressTickets}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Currently being handled</p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-orange-100">
                <Clock className="size-4 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-emerald-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Resolved</p>
                <h3 className="mt-1 text-xl font-bold">{resolvedTickets}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Completed tickets</p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="size-4 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Main Admin Modules */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center">
              <Users className="mr-2 size-5" />
              Users Management
            </CardTitle>
            <CardDescription>
              View and manage users in your application
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Manage user accounts, roles, subscriptions, and account status. View detailed user information and activity.
            </p>
            <Link href="/admin/users">
              <Button className="gap-2">
                Manage Users
                <Users className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 size-5" />
              Support Tickets
            </CardTitle>
            <CardDescription>
              Manage support requests from your users
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Review, respond to, and resolve user support tickets. Track ticket status and maintain communication with users.
            </p>
            <Link href="/admin/support">
              <Button className="gap-2">
                Manage Support Tickets
                <MessageSquare className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Analytics Section */}
      <div className="mb-8">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center">
              <BarChart4 className="mr-2 size-5" />
              Analytics Dashboard
            </CardTitle>
            <CardDescription>
              Track key metrics and app performance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Coming soon! Get insights into user activity, subscription conversions, and overall platform usage.
            </p>
            <Button disabled className="gap-2">
              View Analytics
              <BarChart4 className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Configuration */}
      <div className="mb-8">
        <ConfigureStripePortalButton />
      </div>
    </div>
  );
}
