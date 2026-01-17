import { useState, useMemo } from "react";
import {
  useTimeSlots,
  useCreateTimeSlot,
  useUpdateTimeSlot,
  useDeleteTimeSlot,
} from "../hooks/useTimeSlots";
import { useEventTypes } from "../hooks/useEventTypes";
import { TimeSlot } from "../api/admin-time-slots";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Clock,
  Calendar,
  Users,
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

export default function TimeSlotsPage() {
  const { data: timeSlotsResponse, isLoading, error } = useTimeSlots();
  const { data: eventTypesResponse } = useEventTypes();
  const createTimeSlot = useCreateTimeSlot();
  const updateTimeSlot = useUpdateTimeSlot();
  const deleteTimeSlot = useDeleteTimeSlot();

  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);

  const [formData, setFormData] = useState({
    event_type_id: "",
    start_time: "",
    end_time: "",
    day_of_week: "",
    max_participants: "",
  });

  const timeSlots = timeSlotsResponse?.data || [];
  const eventTypes = eventTypesResponse?.data || [];

  const filteredTimeSlots = useMemo(() => {
    return timeSlots.filter((ts) => {
      const matchesSearch =
        ts.event_type?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ts.start_time.includes(searchQuery) ||
        ts.end_time.includes(searchQuery) ||
        ts.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEventType =
        eventTypeFilter === "all" || ts.event_type_id === eventTypeFilter;

      return matchesSearch && matchesEventType;
    });
  }, [timeSlots, searchQuery, eventTypeFilter]);

  const handleCreate = async () => {
    if (!formData.event_type_id || !formData.start_time || !formData.end_time) {
      return;
    }

    await createTimeSlot.mutateAsync({
      event_type_id: formData.event_type_id,
      start_time: `${formData.start_time}:00`,
      end_time: `${formData.end_time}:00`,
      day_of_week: formData.day_of_week && formData.day_of_week !== "all" ? parseInt(formData.day_of_week) : null,
      max_participants: formData.max_participants
        ? parseInt(formData.max_participants)
        : null,
    });

    setIsCreateDialogOpen(false);
    setFormData({
      event_type_id: "",
      start_time: "",
      end_time: "",
      day_of_week: "all",
      max_participants: "",
    });
  };

  const handleEdit = async () => {
    if (!editingTimeSlot || !formData.start_time || !formData.end_time) {
      return;
    }

    await updateTimeSlot.mutateAsync({
      id: editingTimeSlot.id,
      updates: {
        start_time: `${formData.start_time}:00`,
        end_time: `${formData.end_time}:00`,
        day_of_week: formData.day_of_week && formData.day_of_week !== "all" ? parseInt(formData.day_of_week) : null,
        max_participants: formData.max_participants
          ? parseInt(formData.max_participants)
          : null,
      },
    });

    setIsEditDialogOpen(false);
    setEditingTimeSlot(null);
  };

  const handleDelete = async () => {
    if (selectedTimeSlot) {
      await deleteTimeSlot.mutateAsync(selectedTimeSlot.id);
      setIsDeleteDialogOpen(false);
      setSelectedTimeSlot(null);
    }
  };

  const openEditDialog = (timeSlot: TimeSlot) => {
    setEditingTimeSlot(timeSlot);
    setFormData({
      event_type_id: timeSlot.event_type_id,
      start_time: timeSlot.start_time.substring(0, 5),
      end_time: timeSlot.end_time.substring(0, 5),
      day_of_week: timeSlot.day_of_week?.toString() || "all",
      max_participants: timeSlot.max_participants?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Time Slots</h1>
          <p className="text-muted-foreground mt-2">Manage all time slots</p>
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
          <h1 className="text-3xl font-bold">Time Slots</h1>
          <p className="text-muted-foreground mt-2">
            Manage all time slots ({filteredTimeSlots.length} total)
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Time Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Time Slot</DialogTitle>
              <DialogDescription>
                Add a new time slot for bookings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={formData.event_type_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, event_type_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((et) => (
                      <SelectItem key={et.id} value={et.id}>
                        {et.title}
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
                <Label>Day of Week (Optional)</Label>
                <Select
                  value={formData.day_of_week || "all"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, day_of_week: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All days</SelectItem>
                    {dayNames.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Participants (Optional)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData({ ...formData, max_participants: e.target.value })
                  }
                  placeholder="No limit"
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
            placeholder="Search time slots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Event Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Event Types</SelectItem>
            {eventTypes.map((et) => (
              <SelectItem key={et.id} value={et.id}>
                {et.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Slots List */}
      <div className="space-y-4">
        {error ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="text-destructive">
              <p className="font-medium">Error loading time slots</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message || "Failed to load time slots"}
              </p>
            </div>
          </div>
        ) : filteredTimeSlots.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            {timeSlots.length === 0
              ? "No time slots found"
              : "No time slots match your filters"}
          </div>
        ) : (
          filteredTimeSlots.map((ts) => (
            <div
              key={ts.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {ts.start_time.substring(0, 5)} - {ts.end_time.substring(0, 5)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ts.event_type?.title || "Unknown Event Type"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {ts.day_of_week !== null && (
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {dayNames[ts.day_of_week]}
                    </Badge>
                  )}
                  {ts.max_participants && (
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      Max {ts.max_participants}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(ts)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTimeSlot(ts);
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
            <DialogTitle>Edit Time Slot</DialogTitle>
            <DialogDescription>Update time slot details</DialogDescription>
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
              <Label>Day of Week (Optional)</Label>
              <Select
                value={formData.day_of_week || "all"}
                onValueChange={(value) =>
                  setFormData({ ...formData, day_of_week: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All days</SelectItem>
                  {dayNames.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Participants (Optional)</Label>
              <Input
                type="number"
                min="1"
                value={formData.max_participants}
                onChange={(e) =>
                  setFormData({ ...formData, max_participants: e.target.value })
                }
                placeholder="No limit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingTimeSlot(null);
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
            <AlertDialogTitle>Delete Time Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time slot? This action cannot be
              undone.
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
