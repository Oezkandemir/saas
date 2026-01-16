import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  FileText,
  QrCode,
  CreditCard,
  Calendar,
  Building,
  LayoutDashboard,
  LineChart,
  DollarSign,
  UserCog,
  Webhook,
  Mail,
  Activity,
  Settings,
  HelpCircle,
  FolderOpen,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useCustomers } from "../../hooks/useCustomers";
import { useDocuments } from "../../hooks/useDocuments";
import { useQRCodes } from "../../hooks/useQRCodes";
import { useSubscriptions } from "../../hooks/useSubscriptions";
import { useBookings } from "../../hooks/useBookings";
import { useCompanyProfiles } from "../../hooks/useCompanies";
import { useUsers } from "../../hooks/useUsers";
import { adminSidebarLinks } from "../../config/admin";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Fetch all data (with larger page sizes for search)
  const { data: customersData } = useCustomers({ page: 1, pageSize: 1000 });
  const { data: documentsData } = useDocuments({ page: 1, pageSize: 1000 });
  const { data: qrCodesData } = useQRCodes();
  const { data: subscriptionsData } = useSubscriptions();
  const { data: bookingsData } = useBookings();
  const { data: companiesData } = useCompanyProfiles();
  const { data: usersData } = useUsers({ page: 1, pageSize: 1000 });

  // Page definitions with descriptions
  const pages = useMemo(() => {
    const pageMap: Record<string, { title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
      "/": { title: "Dashboard", description: "Overview of system statistics and activity", icon: LayoutDashboard },
      "/users": { title: "Users", description: "Manage user accounts, roles, and permissions", icon: Users },
      "/customers": { title: "Customers", description: "View and manage customer information", icon: Users },
      "/documents": { title: "Documents", description: "Manage invoices, quotes, and other documents", icon: FileText },
      "/document-templates": { title: "Document Templates", description: "Create and manage document templates", icon: FileText },
      "/qr-codes": { title: "QR Codes", description: "Create and manage QR codes for customers", icon: QrCode },
      "/subscriptions": { title: "Subscriptions", description: "Manage user subscriptions and billing", icon: CreditCard },
      "/bookings": { title: "Bookings", description: "View and manage appointment bookings", icon: Calendar },
      "/scheduling": { title: "Scheduling Management", description: "Manage event types and availability", icon: Calendar },
      "/analytics": { title: "Analytics", description: "View detailed analytics and reports", icon: LineChart },
      "/analytics/feature-usage": { title: "Feature Usage", description: "Track feature usage analytics", icon: Activity },
      "/revenue": { title: "Revenue", description: "Track revenue, payments, and financial data", icon: DollarSign },
      "/plans": { title: "Plans", description: "Manage subscription plans and pricing", icon: CreditCard },
      "/roles": { title: "Roles", description: "Configure user roles and permissions", icon: UserCog },
      "/webhooks": { title: "Webhooks", description: "Manage webhook endpoints and events", icon: Webhook },
      "/emails": { title: "Emails", description: "View email logs and templates", icon: Mail },
      "/notifications": { title: "Notifications", description: "Manage system notifications", icon: Bell },
      "/companies": { title: "Company Profiles", description: "Manage company profile information", icon: Building },
      "/blog": { title: "Blog Posts", description: "Create and manage blog content", icon: FileText },
      "/support": { title: "Support", description: "Manage support tickets and customer inquiries", icon: HelpCircle },
      "/activity": { title: "Activity", description: "View system activity and audit logs", icon: Activity },
      "/settings": { title: "Settings", description: "Configure system settings and preferences", icon: Settings },
      "/system": { title: "System", description: "Monitor system health and status", icon: Activity },
    };
    return adminSidebarLinks.flatMap((section) =>
      section.items
        .map((item) => {
          const pageInfo = pageMap[item.href];
          if (!pageInfo) {
            // Skip pages that don't have entries in pageMap
            return null;
          }
          return {
            href: item.href,
            ...pageInfo,
          };
        })
        .filter((page): page is NonNullable<typeof page> => page !== null)
    );
  }, []);

  // Search results
  const results = useMemo<SearchResult[]>(() => {
    if (!query || query.length < 2) return [];

    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search pages first (for quick navigation)
    pages.forEach((page) => {
      if (
        page.title.toLowerCase().includes(searchTerm) ||
        page.description.toLowerCase().includes(searchTerm) ||
        page.href.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: `page-${page.href}`,
          type: "page",
          title: page.title,
          subtitle: page.description,
          icon: page.icon,
          href: page.href,
        });
      }
    });

    // Search users (paginated response: data.data)
    const users = usersData?.data?.data || [];
    users.forEach((user) => {
      if (
        user.email?.toLowerCase().includes(searchTerm) ||
        user.name?.toLowerCase().includes(searchTerm) ||
        user.id.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: user.id,
          type: "user",
          title: user.name || user.email || "Unknown User",
          subtitle: `User account • ${user.email || "No email"} • Role: ${user.role || "USER"}`,
          icon: Users,
          href: `/users`,
        });
      }
    });

    // Search customers (paginated response: data.data)
    const customers = customersData?.data?.data || [];
    customers.forEach((customer) => {
      if (
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.company?.toLowerCase().includes(searchTerm)
      ) {
        const customerInfo = [
          customer.email && `Email: ${customer.email}`,
          customer.company && `Company: ${customer.company}`,
          customer.country && `Country: ${customer.country}`,
        ].filter(Boolean).join(" • ");
        
        results.push({
          id: customer.id,
          type: "customer",
          title: customer.name,
          subtitle: customerInfo || "Customer record",
          icon: Users,
          href: `/customers`,
        });
      }
    });

    // Search documents (paginated response: data.data)
    const documents = documentsData?.data?.data || [];
    documents.forEach((doc) => {
      if (
        doc.document_number?.toLowerCase().includes(searchTerm) ||
        doc.customer?.name?.toLowerCase().includes(searchTerm) ||
        doc.type?.toLowerCase().includes(searchTerm)
      ) {
        const docInfo = [
          doc.type && `Type: ${doc.type}`,
          doc.status && `Status: ${doc.status}`,
          doc.customer?.name && `Customer: ${doc.customer.name}`,
        ].filter(Boolean).join(" • ");
        
        results.push({
          id: doc.id,
          type: "document",
          title: `${doc.type || "Document"}: ${doc.document_number || doc.id}`,
          subtitle: docInfo || "Document record",
          icon: FileText,
          href: `/documents`,
        });
      }
    });

    // Search QR codes (simple array: data)
    const qrCodes = qrCodesData?.data || [];
    qrCodes.forEach((qr) => {
      if (
        qr.name?.toLowerCase().includes(searchTerm) ||
        qr.code?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: qr.id,
          type: "qr-code",
          title: qr.name || "Unnamed QR Code",
          subtitle: `QR Code • ${qr.code || "No code"}`,
          icon: QrCode,
          href: `/qr-codes`,
        });
      }
    });

    // Search subscriptions (simple array: data)
    const subscriptions = subscriptionsData?.data || [];
    subscriptions.forEach((sub) => {
      if (
        sub.user?.email?.toLowerCase().includes(searchTerm) ||
        sub.stripe_subscription_id?.toLowerCase().includes(searchTerm) ||
        sub.plan?.toLowerCase().includes(searchTerm)
      ) {
        const subInfo = [
          sub.plan && `Plan: ${sub.plan}`,
          sub.status && `Status: ${sub.status}`,
          sub.user?.email && `User: ${sub.user.email}`,
        ].filter(Boolean).join(" • ");
        
        results.push({
          id: sub.id,
          type: "subscription",
          title: `${sub.plan || "Subscription"} - ${sub.user?.email || "Unknown User"}`,
          subtitle: subInfo || "Subscription record",
          icon: CreditCard,
          href: `/subscriptions`,
        });
      }
    });

    // Search bookings (simple array: data)
    const bookings = bookingsData?.data || [];
    bookings.forEach((booking) => {
      if (
        booking.invitee_name?.toLowerCase().includes(searchTerm) ||
        booking.invitee_email?.toLowerCase().includes(searchTerm)
      ) {
        const bookingInfo = [
          booking.invitee_email && `Email: ${booking.invitee_email}`,
          booking.status && `Status: ${booking.status}`,
        ].filter(Boolean).join(" • ");
        
        results.push({
          id: booking.id,
          type: "booking",
          title: booking.invitee_name || "Unnamed Booking",
          subtitle: bookingInfo || booking.invitee_email || "Booking record",
          icon: Calendar,
          href: `/bookings`,
        });
      }
    });

    // Search companies (simple array: data)
    const companies = companiesData?.data || [];
    companies.forEach((company) => {
      if (
        company.company_name?.toLowerCase().includes(searchTerm) ||
        company.company_email?.toLowerCase().includes(searchTerm) ||
        company.profile_name?.toLowerCase().includes(searchTerm)
      ) {
        const companyInfo = [
          company.company_email && `Email: ${company.company_email}`,
          company.profile_type && `Type: ${company.profile_type}`,
          company.company_country && `Country: ${company.company_country}`,
        ].filter(Boolean).join(" • ");
        
        results.push({
          id: company.id,
          type: "company",
          title: company.company_name || company.profile_name || "Unnamed Company",
          subtitle: companyInfo || company.company_email || "Company profile",
          icon: Building,
          href: `/companies`,
        });
      }
    });

    // Sort results: pages first, then by type, then alphabetically
    const typeOrder = ["page", "user", "customer", "document", "subscription", "booking", "company", "qr-code"];
    results.sort((a, b) => {
      const aTypeIndex = typeOrder.indexOf(a.type);
      const bTypeIndex = typeOrder.indexOf(b.type);
      if (aTypeIndex !== bTypeIndex) {
        return (aTypeIndex === -1 ? 999 : aTypeIndex) - (bTypeIndex === -1 ? 999 : bTypeIndex);
      }
      return a.title.localeCompare(b.title);
    });

    return results.slice(0, 20); // Limit to 20 results (increased from 10)
  }, [
    query,
    pages,
    usersData,
    customersData,
    documentsData,
    qrCodesData,
    subscriptionsData,
    bookingsData,
    companiesData,
  ]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
            <DialogTitle>Global Search</DialogTitle>
            <DialogDescription>
              Search across pages, users, customers, documents, subscriptions, bookings, and more
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>

            {query.length < 2 ? (
              <div className="max-h-[400px] overflow-y-auto space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background z-10">
                  All Pages
                </div>
                {pages.map((page) => {
                  const Icon = page.icon;
                  if (!Icon) return null;
                  return (
                    <button
                      key={`page-${page.href}`}
                      onClick={() => {
                        navigate(page.href);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{page.title}</div>
                        <div className="text-sm text-muted-foreground truncate mt-0.5">
                          {page.description}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded bg-muted flex-shrink-0">
                        page
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-1">
                {results.map((result) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        <div className="text-sm text-muted-foreground truncate mt-0.5">
                          {result.subtitle}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded bg-muted flex-shrink-0">
                        {result.type.replace("-", " ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
