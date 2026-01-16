import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/use-debounce";
import { Pagination } from "../components/ui/pagination";
import {
  useCustomers,
  useCustomerStats,
  useUpdateCustomer,
  useDeleteCustomer,
} from "../hooks/useCustomers";
import { Customer, CustomerInput } from "../api/admin-customers";
import {
  Search,
  Mail,
  Phone,
  Building,
  Trash2,
  Edit,
  Download,
  MapPin,
  User,
  MapPin as MapPinIcon,
  FileText,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { Users } from "lucide-react";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null
  );
  const [editForm, setEditForm] = useState<CustomerInput>({
    name: "",
    email: "",
    phone: "",
    company: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    country: "",
    tax_id: "",
    notes: "",
  });

  // Use debounced search to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: customersResponse, isLoading, error } = useCustomers({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    country: countryFilter !== "all" ? countryFilter : undefined,
  });

  const { data: statsResponse } = useCustomerStats();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const paginatedData = customersResponse?.data;
  const customers = paginatedData?.data || [];
  const stats = statsResponse?.data;

  // Debug: Log the response structure
  useEffect(() => {
    if (customersResponse) {
      console.log("Customers Response:", customersResponse);
      console.log("Paginated Data:", paginatedData);
      console.log("Customers:", customers);
      console.log("Total:", paginatedData?.total);
    }
    if (error) {
      console.error("Error loading customers:", error);
    }
  }, [customersResponse, paginatedData, customers, error]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, countryFilter]);

  const handleOpenDrawer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditing(false);
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      address_line1: customer.address_line1 || "",
      address_line2: customer.address_line2 || "",
      city: customer.city || "",
      postal_code: customer.postal_code || "",
      country: customer.country || "",
      tax_id: customer.tax_id || "",
      notes: customer.notes || "",
    });
  };

  const handleSave = async () => {
    if (editingCustomer) {
      try {
        await updateCustomer.mutateAsync({
          id: editingCustomer.id,
          input: editForm,
        });
        setEditingCustomer(null);
      } catch (error) {
        // Error is handled by the mutation hook
        console.error("Failed to update customer:", error);
      }
    }
  };

  const handleDelete = async () => {
    if (deletingCustomer) {
      await deleteCustomer.mutateAsync(deletingCustomer.id);
      setDeletingCustomer(null);
    }
  };

  const handleExport = () => {
    // Export only current page data (to avoid loading all data)
    const csv = [
      [
        "Name",
        "Email",
        "Phone",
        "Company",
        "City",
        "Country",
        "Created",
        "User",
      ],
      ...customers.map((c) => [
        c.name || "",
        c.email || "",
        c.phone || "",
        c.company || "",
        c.city || "",
        c.country || "",
        new Date(c.created_at).toLocaleDateString(),
        c.user?.email || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-page-${page}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get unique countries from stats
  const uniqueCountries = stats?.byCountry.map((c) => c.country) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-2">Manage all customers</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-2">Manage all customers</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="text-center py-8">
            <p className="text-destructive mb-2">Error loading customers</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-2">
            Manage all customers ({paginatedData?.total || 0} total)
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Total Customers</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Last 30 Days</div>
            <div className="text-2xl font-bold mt-1">{stats.recent}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">With Email</div>
            <div className="text-2xl font-bold mt-1">{stats.withEmail}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">With Phone</div>
            <div className="text-2xl font-bold mt-1">{stats.withPhone}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, company, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Countries</option>
          {uniqueCountries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      {/* Customers List - Mobile Card View */}
      <div className="md:hidden space-y-4">
        {customers.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8">
            <EmptyState
              icon={Users}
              title="No customers found"
              description={
                searchQuery
                  ? `No customers match your search "${searchQuery}"`
                  : "Get started by creating your first customer"
              }
            />
          </div>
        ) : (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDrawer(customer);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{customer.name}</div>
                  {customer.company && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Building className="h-3 w-3" />
                      {customer.company}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDrawer(customer);
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCustomer(customer);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Contact</div>
                  <div className="space-y-1">
                    {customer.email && (
                      <div className="text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {customer.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Location</div>
                  {(customer.city || customer.country) && (
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {[customer.city, customer.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Owner</div>
                  <div className="text-sm">
                    {customer.user?.email || "Unknown"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Created</div>
                  <div className="text-sm">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customers Table - Desktop View */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8">
                  <EmptyState
                    icon={Users}
                    title="No customers found"
                    description={
                      searchQuery
                        ? `No customers match your search "${searchQuery}"`
                        : "Get started by creating your first customer"
                    }
                  />
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={(e) => {
                    // Don't open drawer if clicking actions buttons
                    if ((e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    handleOpenDrawer(customer);
                  }}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      {customer.company && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          {customer.company}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(customer.city || customer.country) && (
                      <div className="text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {[customer.city, customer.country]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {customer.user?.email || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer(customer);
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingCustomer(customer);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {paginatedData && paginatedData.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border">
            <Pagination
              currentPage={page}
              totalPages={paginatedData.totalPages}
              onPageChange={setPage}
              totalItems={paginatedData.total}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <Sheet
        open={!!selectedCustomer}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCustomer(null);
            setIsEditing(false);
            setEditingCustomer(null);
          }
        }}
      >
        <SheetContent className="overflow-y-auto p-0 flex flex-col h-full sm:max-w-2xl">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl">
                {isEditing ? "Edit Customer" : "Customer Details"}
              </SheetTitle>
              <SheetDescription>
                {selectedCustomer?.name 
                  ? isEditing 
                    ? `Editing: ${selectedCustomer.name}` 
                    : `Viewing: ${selectedCustomer.name}`
                  : isEditing 
                    ? "Update customer information" 
                    : "View customer information"}
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {!isEditing ? (
              <>
                {/* View Mode */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Basic Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Name</div>
                        <div className="font-medium">{selectedCustomer?.name || "—"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Email</div>
                        <div className="text-sm">{selectedCustomer?.email || "—"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Phone</div>
                        <div className="text-sm">{selectedCustomer?.phone || "—"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Company</div>
                        <div className="text-sm">{selectedCustomer?.company || "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  {(selectedCustomer?.address_line1 || selectedCustomer?.city || selectedCustomer?.country) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <MapPinIcon className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Address</h3>
                      </div>
                      <div className="space-y-2 pl-12">
                        {selectedCustomer?.address_line1 && (
                          <div className="text-sm">{selectedCustomer.address_line1}</div>
                        )}
                        {selectedCustomer?.address_line2 && (
                          <div className="text-sm">{selectedCustomer.address_line2}</div>
                        )}
                        <div className="text-sm">
                          {[selectedCustomer?.city, selectedCustomer?.postal_code, selectedCustomer?.country]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  {(selectedCustomer?.tax_id || selectedCustomer?.notes) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Additional Information</h3>
                      </div>
                      <div className="space-y-2 pl-12">
                        {selectedCustomer?.tax_id && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Tax ID</div>
                            <div className="text-sm">{selectedCustomer.tax_id}</div>
                          </div>
                        )}
                        {selectedCustomer?.notes && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Notes</div>
                            <div className="text-sm whitespace-pre-wrap">{selectedCustomer.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Edit Button */}
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(true);
                        if (selectedCustomer) {
                          setEditingCustomer(selectedCustomer);
                          setEditForm({
                            name: selectedCustomer.name || "",
                            email: selectedCustomer.email || "",
                            phone: selectedCustomer.phone || "",
                            company: selectedCustomer.company || "",
                            address_line1: selectedCustomer.address_line1 || "",
                            address_line2: selectedCustomer.address_line2 || "",
                            city: selectedCustomer.city || "",
                            postal_code: selectedCustomer.postal_code || "",
                            country: selectedCustomer.country || "",
                            tax_id: selectedCustomer.tax_id || "",
                            notes: selectedCustomer.notes || "",
                          });
                        }
                      }}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Customer
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Edit Mode */}
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      placeholder="Customer name"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      placeholder="customer@example.com"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      placeholder="+1 (555) 000-0000"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium">Company</Label>
                    <Input
                      id="company"
                      value={editForm.company}
                      onChange={(e) =>
                        setEditForm({ ...editForm, company: e.target.value })
                      }
                      placeholder="Company name"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPinIcon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Address</h3>
                </div>
                <div className="space-y-4 pl-12">
                  <div className="space-y-2">
                    <Label htmlFor="address_line1" className="text-sm font-medium">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={editForm.address_line1}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address_line1: e.target.value })
                      }
                      placeholder="Street address"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line2" className="text-sm font-medium">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={editForm.address_line2}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address_line2: e.target.value })
                      }
                      placeholder="Apartment, suite, etc."
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input
                        id="city"
                        value={editForm.city}
                        onChange={(e) =>
                          setEditForm({ ...editForm, city: e.target.value })
                        }
                        placeholder="City"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code" className="text-sm font-medium">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={editForm.postal_code}
                        onChange={(e) =>
                          setEditForm({ ...editForm, postal_code: e.target.value })
                        }
                        placeholder="12345"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                      <Input
                        id="country"
                        value={editForm.country}
                        onChange={(e) =>
                          setEditForm({ ...editForm, country: e.target.value })
                        }
                        placeholder="Country"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Additional Information</h3>
                </div>
                <div className="space-y-4 pl-12">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id" className="text-sm font-medium">Tax ID</Label>
                    <Input
                      id="tax_id"
                      value={editForm.tax_id}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tax_id: e.target.value })
                      }
                      placeholder="Tax identification number"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      rows={5}
                      placeholder="Additional notes about this customer..."
                      className="w-full resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
              </>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-10 bg-background border-t border-border px-6 py-4">
            <SheetFooter className="gap-2 sm:gap-0">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingCustomer(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={async () => {
                      await handleSave();
                      setIsEditing(false);
                    }} 
                    disabled={!editForm.name || updateCustomer.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateCustomer.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIsEditing(false);
                  }}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              )}
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCustomer}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer{" "}
              <strong>{deletingCustomer?.name}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCustomer(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
