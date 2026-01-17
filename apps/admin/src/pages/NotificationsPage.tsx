import { useState } from "react";
import {
  useNotifications,
  useNotificationStats,
  useUpdateNotificationReadStatus,
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useBulkDeleteNotifications,
  useCreateNotification,
} from "../hooks/useNotifications";
import { UserNotification } from "../api/admin-notifications";
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  User,
  Filter,
  Plus,
  Download,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { StatCard } from "../components/ui/stat-card";
import { Pagination } from "../components/ui/pagination";
import { useDebounce } from "../hooks/use-debounce";
import { Checkbox } from "../components/ui/checkbox";
import { BulkActionsBar } from "../components/ui/bulk-actions-bar";
import { LoadingButton } from "../components/ui/loading-button";
import { exportToCSV } from "../lib/export";
import { formatDate, formatRelativeTime } from "../lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useUsers } from "../hooks/useUsers";
import { toast } from "sonner";

const NOTIFICATION_TYPES = [
  "WELCOME",
  "ROLE_CHANGE",
  "SYSTEM",
  "BILLING",
  "SUPPORT",
  "SUCCESS",
  "TEAM",
  "NEWSLETTER",
  "DOCUMENT",
  "CUSTOMER",
  "INVOICE",
  "PAYMENT",
  "SUBSCRIPTION",
  "SECURITY",
];

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [userIdFilter, setUserIdFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    user_id: "",
    title: "",
    content: "",
    type: "SYSTEM",
    action_url: "",
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: notificationsResponse, isLoading } = useNotifications({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    userId: userIdFilter !== "all" ? userIdFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    read: readFilter !== "all" ? (readFilter === "read" ? true : false) : undefined,
  });

  const { data: statsResponse } = useNotificationStats();
  const { data: usersResponse } = useUsers({ page: 1, pageSize: 1000 });
  const updateReadStatus = useUpdateNotificationReadStatus();
  const deleteNotification = useDeleteNotification();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const bulkDelete = useBulkDeleteNotifications();
  const createNotification = useCreateNotification();

  const notifications = notificationsResponse?.data?.data || [];
  const stats = statsResponse?.data;
  const users = usersResponse?.data?.data || [];

  const handleToggleRead = (notification: UserNotification) => {
    updateReadStatus.mutate({
      id: notification.id,
      read: !notification.read,
    });
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDelete.mutate(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleMarkAllAsRead = (userId: string) => {
    markAllAsRead.mutate(userId);
  };

  const handleCreateNotification = () => {
    if (!newNotification.user_id || !newNotification.title || !newNotification.content) {
      toast.error("Please fill in all required fields");
      return;
    }
    createNotification.mutate({
      user_id: newNotification.user_id,
      title: newNotification.title,
      content: newNotification.content,
      type: newNotification.type,
      action_url: newNotification.action_url || undefined,
    });
    setIsCreateDialogOpen(false);
    setNewNotification({
      user_id: "",
      title: "",
      content: "",
      type: "SYSTEM",
      action_url: "",
    });
  };

  const handleExport = () => {
    const exportData = notifications.map((n) => ({
      ID: n.id,
      User: n.user?.email || n.user_id,
      Title: n.title,
      Content: n.content,
      Type: n.type,
      Read: n.read ? "Yes" : "No",
      "Action URL": n.action_url || "",
      "Created At": formatDate(n.created_at),
    }));
    exportToCSV(exportData, "notifications");
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  if (isLoading && !notificationsResponse) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Manage all user notifications
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Manage all user notifications
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Notifications"
            value={stats.total}
            icon={Bell}
          />
          <StatCard
            title="Unread"
            value={stats.unread}
            icon={BellOff}
          />
          <StatCard
            title="Recent (7 days)"
            value={stats.recent}
            icon={Mail}
          />
          <StatCard
            title="Types"
            value={Object.keys(stats.byType).length}
            icon={Filter}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={userIdFilter} onValueChange={setUserIdFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {NOTIFICATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "Delete",
              onClick: handleBulkDelete,
              variant: "destructive",
            },
          ]}
        />
      )}

      {/* Table */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          description="There are no notifications matching your filters."
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-12 p-4 text-left">
                    <Checkbox
                      checked={selectedIds.size === notifications.length && notifications.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium">User</th>
                  <th className="p-4 text-left text-sm font-medium">Title</th>
                  <th className="p-4 text-left text-sm font-medium">Type</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">Created</th>
                  <th className="p-4 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className="border-t border-border hover:bg-muted/50"
                    onClick={(e) => {
                      // Don't open drawer if clicking buttons or checkboxes
                      if (
                        (e.target as HTMLElement).closest("button") ||
                        (e.target as HTMLElement).closest('input[type="checkbox"]')
                      ) {
                        return;
                      }
                      // Could add a detail view here if needed
                    }}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(notification.id)}
                        onCheckedChange={() => toggleSelect(notification.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {notification.user?.email || notification.user_id}
                          </div>
                          {notification.user?.name && (
                            <div className="text-sm text-muted-foreground">
                              {notification.user.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {notification.content}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{notification.type}</Badge>
                    </td>
                    <td className="p-4">
                      {notification.read ? (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Read
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unread
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatRelativeTime(notification.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRead(notification);
                          }}
                          title={notification.read ? "Mark as unread" : "Mark as read"}
                        >
                          {notification.read ? (
                            <BellOff className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        {notification.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAllAsRead(notification.user_id);
                            }}
                            title="Mark all as read for user"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {notificationsResponse?.data && notificationsResponse.data.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={notificationsResponse.data.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
            <DialogDescription>
              Create a new notification for a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user">User *</Label>
              <Select
                value={newNotification.user_id}
                onValueChange={(value) =>
                  setNewNotification({ ...newNotification, user_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={newNotification.type}
                onValueChange={(value) =>
                  setNewNotification({ ...newNotification, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newNotification.title}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, title: e.target.value })
                }
                placeholder="Notification title"
              />
            </div>
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={newNotification.content}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, content: e.target.value })
                }
                placeholder="Notification content"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="action_url">Action URL (optional)</Label>
              <Input
                id="action_url"
                value={newNotification.action_url}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, action_url: e.target.value })
                }
                placeholder="https://example.com/action"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleCreateNotification}
              loading={createNotification.isPending}
            >
              Create
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
