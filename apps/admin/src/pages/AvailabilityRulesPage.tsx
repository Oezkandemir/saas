import { useState, useMemo } from "react";
import {
  useAllAvailabilityRules,
  useCreateAvailabilityRule,
  useUpdateAvailabilityRule,
  useDeleteAvailabilityRule,
} from "../hooks/useAvailability";
import { useEventTypes } from "../hooks/useEventTypes";
import { useUsers } from "../hooks/useUsers";
import { AvailabilityRule } from "../api/admin-availability";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Clock,
  Calendar,
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

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AvailabilityRulesPage() {
  const { data: rulesResponse, isLoading, error } = useAllAvailabilityRules();
  const { data: eventTypesResponse } = useEventTypes();
  const { data: usersResponse } = useUsers({ page: 1, pageSize: 1000 });
  const createRule = useCreateAvailabilityRule();
  const updateRule = useUpdateAvailabilityRule();
  const deleteRule = useDeleteAvailabilityRule();

  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AvailabilityRule | null>(null);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);

  const [formData, setFormData] = useState({
    user_id: "",
    event_type_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    timezone: "Europe/Berlin",
  });

  const rules = rulesResponse?.data || [];
  const eventTypes = eventTypesResponse?.data || [];
  const users = usersResponse?.data?.users || [];

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.event_type?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dayNames[rule.day_of_week]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUser = userFilter === "all" || rule.user_id === userFilter;

      return matchesSearch && matchesUser;
    });
  }, [rules, searchQuery, userFilter]);

  const handleCreate = async () => {
    if (!formData.user_id || !formData.day_of_week || !formData.start_time || !formData.end_time) {
      return;
    }

    await createRule.mutateAsync({
      user_id: formData.user_id,
      day_of_week: parseInt(formData.day_of_week),
      start_time: `${formData.start_time}:00`,
      end_time: `${formData.end_time}:00`,
      timezone: formData.timezone,
      event_type_id: formData.event_type_id || null,
    });

    setIsCreateDialogOpen(false);
    setFormData({
      user_id: "",
      event_type_id: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
      timezone: "Europe/Berlin",
    });
  };

  const handleEdit = async () => {
    if (!editingRule || !formData.start_time || !formData.end_time) {
      return;
    }

    await updateRule.mutateAsync({
      id: editingRule.id,
      updates: {
        start_time: `${formData.start_time}:00`,
        end_time: `${formData.end_time}:00`,
        timezone: formData.timezone,
      },
    });

    setIsEditDialogOpen(false);
    setEditingRule(null);
  };

  const handleDelete = async () => {
    if (selectedRule) {
      await deleteRule.mutateAsync(selectedRule.id);
      setIsDeleteDialogOpen(false);
      setSelectedRule(null);
    }
  };

  const openEditDialog = (rule: AvailabilityRule) => {
    setEditingRule(rule);
    setFormData({
      user_id: rule.user_id,
      event_type_id: rule.event_type_id || "",
      day_of_week: rule.day_of_week.toString(),
      start_time: rule.start_time.substring(0, 5),
      end_time: rule.end_time.substring(0, 5),
      timezone: rule.timezone,
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Availability Rules</h1>
          <p className="text-muted-foreground mt-2">Manage weekly availability rules</p>
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
          <h1 className="text-3xl font-bold">Availability Rules</h1>
          <p className="text-muted-foreground mt-2">
            Manage weekly availability rules ({filteredRules.length} total)
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Availability Rule</DialogTitle>
              <DialogDescription>
                Set weekly availability schedule
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
                  value={formData.event_type_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, event_type_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Global (all event types)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Global (all event types)</SelectItem>
                    {eventTypes.map((et) => (
                      <SelectItem key={et.id} value={et.id}>
                        {et.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={formData.day_of_week}
                  onValueChange={(value) =>
                    setFormData({ ...formData, day_of_week: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
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
            placeholder="Search rules..."
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

      {/* Rules List */}
      <div className="space-y-4">
        {error ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="text-destructive">
              <p className="font-medium">Error loading availability rules</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message || "Failed to load availability rules"}
              </p>
            </div>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            {rules.length === 0
              ? "No availability rules found"
              : "No rules match your filters"}
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {dayNames[rule.day_of_week]} • {rule.start_time.substring(0, 5)} - {rule.end_time.substring(0, 5)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rule.user?.email || "Unknown User"}
                        {rule.event_type && ` • ${rule.event_type.title}`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{rule.timezone}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRule(rule);
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
            <DialogTitle>Edit Availability Rule</DialogTitle>
            <DialogDescription>Update availability rule details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
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
                setEditingRule(null);
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
            <AlertDialogTitle>Delete Availability Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this availability rule? This action
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
