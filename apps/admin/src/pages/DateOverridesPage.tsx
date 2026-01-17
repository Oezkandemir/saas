import { useState, useMemo } from "react";
import {
  useAllAvailabilityOverrides,
  useCreateAvailabilityOverride,
  useUpdateAvailabilityOverride,
  useDeleteAvailabilityOverride,
} from "../hooks/useAvailability";
import { useEventTypes } from "../hooks/useEventTypes";
import { useUsers } from "../hooks/useUsers";
import { AvailabilityOverride } from "../api/admin-availability";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Calendar,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
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
import { Skeleton } from "../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";

export default function DateOverridesPage() {
  const { data: overridesResponse, isLoading, error } = useAllAvailabilityOverrides();
  const { data: eventTypesResponse } = useEventTypes();
  const { data: usersResponse } = useUsers({ page: 1, pageSize: 1000 });
  const createOverride = useCreateAvailabilityOverride();
  const updateOverride = useUpdateAvailabilityOverride();
  const deleteOverride = useDeleteAvailabilityOverride();

  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState<AvailabilityOverride | null>(null);
  const [editingOverride, setEditingOverride] = useState<AvailabilityOverride | null>(null);

  const [formData, setFormData] = useState({
    user_id: "",
    event_type_id: "",
    date: "",
    is_unavailable: false,
    start_time: "",
    end_time: "",
    timezone: "Europe/Berlin",
  });

  const overrides = overridesResponse?.data || [];
  const eventTypes = eventTypesResponse?.data || [];
  const users = usersResponse?.data?.users || [];

  const filteredOverrides = useMemo(() => {
    return overrides.filter((override) => {
      const matchesSearch =
        override.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        override.event_type?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        override.date.includes(searchQuery) ||
        override.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUser = userFilter === "all" || override.user_id === userFilter;

      return matchesSearch && matchesUser;
    });
  }, [overrides, searchQuery, userFilter]);

  const handleCreate = async () => {
    if (!formData.user_id || !formData.date) {
      return;
    }

    await createOverride.mutateAsync({
      user_id: formData.user_id,
      date: formData.date,
      is_unavailable: formData.is_unavailable,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      timezone: formData.timezone,
      event_type_id: formData.event_type_id === "none" ? null : formData.event_type_id || null,
    });

    setIsCreateDialogOpen(false);
    setFormData({
      user_id: "",
      event_type_id: "none",
      date: "",
      is_unavailable: false,
      start_time: "",
      end_time: "",
      timezone: "Europe/Berlin",
    });
  };

  const handleEdit = async () => {
    if (!editingOverride || !formData.date) {
      return;
    }

    await updateOverride.mutateAsync({
      id: editingOverride.id,
      updates: {
        date: formData.date,
        is_unavailable: formData.is_unavailable,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        timezone: formData.timezone,
      },
    });

    setIsEditDialogOpen(false);
    setEditingOverride(null);
  };

  const handleDelete = async () => {
    if (selectedOverride) {
      await deleteOverride.mutateAsync(selectedOverride.id);
      setIsDeleteDialogOpen(false);
      setSelectedOverride(null);
    }
  };

  const openEditDialog = (override: AvailabilityOverride) => {
    setEditingOverride(override);
    setFormData({
      user_id: override.user_id,
      event_type_id: override.event_type_id || "none",
      date: override.date,
      is_unavailable: override.is_unavailable,
      start_time: override.start_time?.substring(0, 5) || "",
      end_time: override.end_time?.substring(0, 5) || "",
      timezone: override.timezone,
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Date Overrides</h1>
          <p className="text-muted-foreground mt-2">Manage date-specific availability exceptions</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Date Overrides</h1>
          <p className="text-muted-foreground mt-2">
            Manage date-specific availability exceptions ({filteredOverrides.length} total)
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Override
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Date Override</DialogTitle>
              <DialogDescription>
                Set availability exception for a specific date
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, user_id: value })
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
              <div className="space-y-2">
                <Label>Event Type (Optional)</Label>
                <Select
                  value={formData.event_type_id || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, event_type_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Global (all event types)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Global (all event types)</SelectItem>
                    {eventTypes.map((et) => (
                      <SelectItem key={et.id} value={et.id}>
                        {et.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_unavailable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_unavailable: checked })
                  }
                />
                <Label>Mark as unavailable</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time (Optional)</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    disabled={formData.is_unavailable && !formData.start_time}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time (Optional)</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    disabled={formData.is_unavailable && !formData.start_time}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                  placeholder="Europe/Berlin"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search overrides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[200px]">
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
      </div>

      {/* Overrides List */}
      <div className="space-y-4">
        {error ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="text-destructive">
              <p className="font-medium">Error loading date overrides</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message || "Failed to load date overrides"}
              </p>
            </div>
          </div>
        ) : filteredOverrides.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            {overrides.length === 0
              ? "No date overrides found"
              : "No overrides match your filters"}
          </div>
        ) : (
          filteredOverrides.map((override) => (
            <div
              key={override.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {new Date(override.date).toLocaleDateString()}
                        {override.start_time && override.end_time && (
                          <span className="text-muted-foreground ml-2">
                            • {override.start_time.substring(0, 5)} - {override.end_time.substring(0, 5)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {override.user?.email || "Unknown User"}
                        {override.event_type && ` • ${override.event_type.title}`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    className={
                      override.is_unavailable
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-green-500/10 text-green-500 border-green-500/20"
                    }
                  >
                    {override.is_unavailable ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Unavailable
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Available
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline">{override.timezone}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(override)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedOverride(override);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Date Override</DialogTitle>
            <DialogDescription>Update date override details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_unavailable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_unavailable: checked })
                }
              />
              <Label>Mark as unavailable</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time (Optional)</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Time (Optional)</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input
                type="text"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                placeholder="Europe/Berlin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingOverride(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Date Override</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this date override? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
