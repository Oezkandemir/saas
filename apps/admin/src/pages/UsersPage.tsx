import { useState, useEffect } from "react";
import {
  useUsers,
  useUserStats,
  useUpdateUserRole,
  useUpdateUserStatus,
  useDeleteUser,
  useBulkUpdateUserRoles,
  useBulkUpdateUserStatus,
} from "../hooks/useUsers";
import { User } from "../api/admin-users";
import {
  Search,
  Mail,
  User as UserIcon,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  Edit,
  Download,
  Users,
  UserCheck,
  UserX,
  CreditCard,
  Calendar,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { StatCard } from "../components/ui/stat-card";
import { Pagination } from "../components/ui/pagination";
import { useDebounce } from "../hooks/use-debounce";
import { StatusBadge } from "../components/ui/status-badge";
import { Checkbox } from "../components/ui/checkbox";
import { BulkActionsBar } from "../components/ui/bulk-actions-bar";
import { LoadingButton } from "../components/ui/loading-button";
import { exportToCSV } from "../lib/export";
import { formatDate } from "../lib/format";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  // Use debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: usersResponse, isLoading, error } = useUsers({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { data: statsResponse } = useUserStats();
  const updateUserRole = useUpdateUserRole();
  const updateUserStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const bulkUpdateRoles = useBulkUpdateUserRoles();
  const bulkUpdateStatus = useBulkUpdateUserStatus();

  const paginatedData = usersResponse?.data;
  const users = paginatedData?.data || [];
  const stats = statsResponse?.data;

  // Debug: Log the response structure
  useEffect(() => {
    if (usersResponse) {
      console.log("Users Response:", usersResponse);
      console.log("Paginated Data:", paginatedData);
      console.log("Users:", users);
      console.log("Total:", paginatedData?.total);
      console.log("Users length:", users.length);
    }
    if (error) {
      console.error("Error loading users:", error);
    }
  }, [usersResponse, paginatedData, users, error]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUserRole.mutateAsync({ userId, newRole });
    setEditingUser(null);
    setNewRole("");
  };

  const handleStatusChange = async (
    userId: string,
    status: "active" | "banned"
  ) => {
    await updateUserStatus.mutateAsync({ userId, status });
  };

  const handleDelete = async () => {
    if (deletingUser) {
      await deleteUser.mutateAsync(deletingUser.id);
      setDeletingUser(null);
    }
  };

  const handleBulkRoleChange = async (newRole: string) => {
    if (selectedUserIds.size === 0) return;
    await bulkUpdateRoles.mutateAsync({
      userIds: Array.from(selectedUserIds),
      newRole,
    });
    setSelectedUserIds(new Set());
  };

  const handleBulkStatusChange = async (status: "active" | "banned") => {
    if (selectedUserIds.size === 0) return;
    await bulkUpdateStatus.mutateAsync({
      userIds: Array.from(selectedUserIds),
      status,
    });
    setSelectedUserIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) return;
    // Delete users one by one (could be optimized with a bulk delete API)
    for (const userId of selectedUserIds) {
      await deleteUser.mutateAsync(userId);
    }
    setSelectedUserIds(new Set());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleExport = () => {
    const exportData = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || "",
      role: u.role,
      status: u.status,
      subscription: u.polar_subscription_id || u.stripe_subscription_id ? "Yes" : "No",
      created_at: formatDate(u.created_at),
    }));

    exportToCSV(exportData, {
      filename: "users",
      headers: ["ID", "Email", "Name", "Role", "Status", "Subscription", "Created"],
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "USER":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const allSelected = users.length > 0 && selectedUserIds.size === users.length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">Manage users and permissions</p>
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
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">Manage users and permissions</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="text-center py-8">
            <p className="text-destructive mb-2">Error loading users</p>
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
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage users and permissions ({paginatedData?.total || 0} total)
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.total}
            icon={Users}
            description="All registered users"
          />
          <StatCard
            title="Admin Users"
            value={stats.admins}
            icon={Shield}
            description="Users with admin privileges"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.withSubscription}
            icon={CreditCard}
            description="Users with active subscriptions"
          />
          <StatCard
            title="New This Month"
            value={stats.recent}
            icon={Calendar}
            description="Users registered in last 30 days"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email, name, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="USER">USER</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedUserIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedUserIds.size}
          actions={[
            {
              label: "Set Role: ADMIN",
              onClick: () => handleBulkRoleChange("ADMIN"),
              variant: "default",
            },
            {
              label: "Set Role: USER",
              onClick: () => handleBulkRoleChange("USER"),
              variant: "default",
            },
            {
              label: "Ban Users",
              onClick: () => handleBulkStatusChange("banned"),
              variant: "default",
            },
            {
              label: "Unban Users",
              onClick: () => handleBulkStatusChange("active"),
              variant: "default",
            },
            {
              label: "Delete Users",
              onClick: handleBulkDelete,
              variant: "destructive",
            },
          ]}
          onClear={() => setSelectedUserIds(new Set())}
        />
      )}

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                    User
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                    Role
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                    Status
                  </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  Subscription
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  Created
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8">
                    <EmptyState
                      icon={Users}
                      title="No users found"
                      description={
                        searchQuery
                          ? `No users match your search "${searchQuery}"`
                          : "No users registered yet"
                      }
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelected = selectedUserIds.has(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-muted" : ""}`}
                      onClick={(e) => {
                        // Don't open drawer if clicking checkbox or actions dropdown
                        if ((e.target as HTMLElement).closest('input[type="checkbox"]') || 
                            (e.target as HTMLElement).closest('[role="menu"]') ||
                            (e.target as HTMLElement).closest('button')) {
                          return;
                        }
                        setSelectedUser(user);
                        setIsEditing(false);
                        setNewRole(user.role);
                      }}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectUser(user.id, checked as boolean)
                          }
                          aria-label={`Select user ${user.email}`}
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.name?.[0]?.toUpperCase() ||
                                user.email?.[0]?.toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.name || "No name"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role === "ADMIN" && (
                            <Shield className="h-3 w-3 mr-1" />
                          )}
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {user.polar_subscription_id || user.stripe_subscription_id ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setIsEditing(true);
                                setNewRole(user.role);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(user.id, "banned")}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(user.id, "active")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Unban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingUser(user)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
        {paginatedData && paginatedData.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-border">
            <Pagination
              currentPage={page}
              totalPages={paginatedData.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* User Detail Drawer */}
      <Sheet
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
            setIsEditing(false);
            setEditingUser(null);
            setNewRole("");
          }
        }}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              View and manage user information
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="space-y-6 py-6">
              {!isEditing ? (
                <>
                  {/* View Mode */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedUser.avatar_url || undefined} />
                        <AvatarFallback>
                          {selectedUser.name?.[0]?.toUpperCase() ||
                            selectedUser.email?.[0]?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-lg font-semibold">
                          {selectedUser.name || "No name"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedUser.email || "No email"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Role</div>
                        <Badge
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            selectedUser.role
                          )}`}
                        >
                          {selectedUser.role === "ADMIN" && (
                            <Shield className="h-3 w-3 mr-1" />
                          )}
                          {selectedUser.role}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <StatusBadge status={selectedUser.status} />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Subscription</div>
                        {selectedUser.polar_subscription_id || selectedUser.stripe_subscription_id ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Created</div>
                        <div className="text-sm">
                          {formatDate(selectedUser.created_at)}
                        </div>
                      </div>
                      {selectedUser.polar_subscription_id && (
                        <div className="md:col-span-2">
                          <div className="text-sm text-muted-foreground mb-1">
                            Polar Subscription ID
                          </div>
                          <div className="font-mono text-xs break-all">
                            {selectedUser.polar_subscription_id}
                          </div>
                        </div>
                      )}
                      {selectedUser.stripe_subscription_id && (
                        <div className="md:col-span-2">
                          <div className="text-sm text-muted-foreground mb-1">
                            Stripe Subscription ID
                          </div>
                          <div className="font-mono text-xs break-all">
                            {selectedUser.stripe_subscription_id}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="w-full"
                    >
                      Edit User
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Edit User</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setNewRole(selectedUser.role);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">USER</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={selectedUser.status}
                          onValueChange={(value) => {
                            if (selectedUser) {
                              handleStatusChange(selectedUser.id, value as "active" | "banned");
                            }
                          }}
                        >
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <SheetFooter className="pt-4 border-t border-border">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setNewRole(selectedUser?.role || "");
                  }}
                >
                  Cancel
                </Button>
                <LoadingButton
                  onClick={() =>
                    selectedUser && handleRoleChange(selectedUser.id, newRole)
                  }
                  disabled={!newRole || newRole === selectedUser?.role}
                  loading={updateUserRole.isPending}
                >
                  Save Changes
                </LoadingButton>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedUser(null);
                  setIsEditing(false);
                }}
              >
                Close
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{" "}
              <strong>{deletingUser?.name || deletingUser?.email}</strong>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUser(null)}>
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
