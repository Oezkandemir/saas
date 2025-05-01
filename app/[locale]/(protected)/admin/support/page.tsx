import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllTickets } from "@/actions/support-ticket-actions";
import { AlertTriangle, CheckCircle, Clock, HelpCircle } from "lucide-react";
import { TicketAccordionTable } from "@/components/support/ticket-accordion-table";

export default async function AdminSupportPage() {
  const user = await getCurrentUser();
  
  if (!user?.email) {
    redirect("/login");
  }

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";
  
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch all tickets using our server action
  const result = await getAllTickets();

  if (!result.success || !result.data) {
    console.error("Error fetching tickets:", result.error);
    return (
      <>
        <DashboardHeader
          heading="Support Tickets Management"
          text="Error loading tickets. Please try again later."
        />
      </>
    );
  }

  const tickets = result.data;

  // Calculate stats
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(ticket => ticket.status === 'open').length;
  const inProgressTickets = tickets.filter(ticket => ticket.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved' || ticket.status === 'closed').length;

  return (
    <div className="container px-0 sm:px-4">
      <DashboardHeader
        heading="Support Tickets Management"
        text="View and manage all support requests from your users."
      />
      
      {/* Ticket Stats Section */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <HelpCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground">All support tickets</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Tickets</CardTitle>
            <AlertTriangle className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">Currently being handled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedTickets}</div>
            <p className="text-xs text-muted-foreground">Completed tickets</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 px-1 sm:px-0">
        <Card>
          <CardHeader>
            <CardTitle>All Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketAccordionTable data={tickets} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 