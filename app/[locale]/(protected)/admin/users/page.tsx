import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/session";
import { DataTable } from "@/components/admin/users/data-table";
import { columns } from "@/components/admin/users/columns";
import { formatDistance } from "date-fns";
import { getAllUsers } from "@/actions/admin-user-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, ShieldCheckIcon, BanIcon, CreditCardIcon } from "lucide-react";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  
  if (!user?.email) {
    redirect("/login");
  }

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";
  
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch all users using our server action
  const result = await getAllUsers();

  if (!result.success || !result.data) {
    console.error("Error fetching users:", result.error);
    return (
      <>
        <DashboardHeader
          heading="Users Management"
          text="Error loading users. Please try again later."
        />
      </>
    );
  }

  const users = result.data;

  // Calculate stats
  const totalUsers = users.length;
  const adminUsers = users.filter(user => user.role === "ADMIN").length;
  const bannedUsers = users.filter(user => user.status === "banned").length;
  const subscribedUsers = users.filter(user => user.stripe_subscription_id).length;

  // Format the data for the table
  const formattedUsers = users.map(user => {
    return {
      id: user.id,
      name: user.name || "N/A",
      email: user.email || "N/A",
      role: user.role || "USER",
      status: user.status || "active",
      createdAt: user.created_at ? 
        formatDistance(new Date(user.created_at), new Date(), { addSuffix: true }) : 
        "N/A",
      lastSignIn: user.last_sign_in ? 
        formatDistance(new Date(user.last_sign_in), new Date(), { addSuffix: true }) : 
        "Never",
      emailVerified: user.email_verified,
      hasSubscription: !!user.stripe_subscription_id,
      avatar_url: user.avatar_url || null,
    };
  });

  return (
    <>
      <DashboardHeader
        heading="Users Management"
        text="View and manage all users in your application."
      />
      
      {/* User Stats Section */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users with admin privileges
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <BanIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bannedUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently suspended accounts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribedUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active paid subscriptions
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <DataTable columns={columns} data={formattedUsers} />
      </div>
    </>
  );
} 