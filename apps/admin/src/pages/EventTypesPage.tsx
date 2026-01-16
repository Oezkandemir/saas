import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEventTypes,
  useCreateEventType,
  useUpdateEventType,
  useDeleteEventType,
} from "../hooks/useEventTypes";
import { useAuth } from "../lib/auth";
import { EventType } from "../api/admin-event-types";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Save,
  Plus,
  RefreshCw,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { ResponsiveList, ResponsiveCard, ResponsiveCardRow, ResponsiveCardGrid } from "../components/ui/responsive-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";

const eventTypeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string().max(1000).optional(),
  duration_minutes: z.number().int().min(5).max(480),
  buffer_before_minutes: z.number().int().min(0).default(0),
  buffer_after_minutes: z.number().int().min(0).default(0),
  location_type: z
    .enum(["google_meet", "zoom", "custom_link", "phone", "in_person"])
    .default("google_meet"),
  location_value: z.string().max(500).optional(),
  minimum_notice_hours: z.number().int().min(0),
  booking_window_days: z.number().int().min(1),
  is_active: z.boolean().default(true),
  price_amount: z.number().min(0).optional().nullable(),
  price_currency: z.string().max(3).default("EUR").optional(),
});

export default function EventTypesPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: eventTypesResponse, isLoading, error, refetch, isRefetching } = useEventTypes();
  const createEventType = useCreateEventType();
  const updateEventType = useUpdateEventType();
  const deleteEventType = useDeleteEventType();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  const editForm = useForm<z.infer<typeof eventTypeSchema>>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      duration_minutes: 30,
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
      location_type: "google_meet",
      location_value: "",
      minimum_notice_hours: 2,
      booking_window_days: 30,
      is_active: true,
      price_amount: null,
      price_currency: "EUR",
    },
  });

  const createForm = useForm<z.infer<typeof eventTypeSchema>>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      duration_minutes: 30,
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
      location_type: "google_meet",
      location_value: "",
      minimum_notice_hours: 2,
      booking_window_days: 30,
      is_active: true,
      price_amount: null,
      price_currency: "EUR",
    },
  });

  const eventTypes = eventTypesResponse || [];

  // Debug: Log event types
  useEffect(() => {
    console.log("Event Types Response:", eventTypesResponse);
    console.log("Event Types Count:", eventTypes.length);
    console.log("Event Types:", eventTypes);
  }, [eventTypesResponse, eventTypes.length]);

  const filteredEventTypes = useMemo(() => {
    return eventTypes.filter((et) => {
      const matchesSearch =
        et.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        et.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        et.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        et.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [eventTypes, searchQuery]);

  const handleUpdateStatus = async (id: string, isActive: boolean) => {
    setIsUpdating(true);
    await updateEventType.mutateAsync({
      id,
      updates: { is_active: isActive },
    });
    setIsUpdating(false);
  };

  const openEditDialog = (eventType: EventType) => {
    setEditingEventType(eventType);
    editForm.reset({
      title: eventType.title,
      slug: eventType.slug,
      description: eventType.description || "",
      duration_minutes: eventType.duration_minutes,
      buffer_before_minutes: eventType.buffer_before_minutes || 0,
      buffer_after_minutes: eventType.buffer_after_minutes || 0,
      location_type: eventType.location_type,
      location_value: eventType.location_value || "",
      minimum_notice_hours: eventType.minimum_notice_hours,
      booking_window_days: eventType.booking_window_days,
      is_active: eventType.is_active,
      price_amount: eventType.price_amount || null,
      price_currency: eventType.price_currency || "EUR",
    });
    setIsEditSheetOpen(true);
  };

  const handleEditSubmit = async (data: z.infer<typeof eventTypeSchema>) => {
    if (!editingEventType) return;

    setIsUpdating(true);
    try {
      await updateEventType.mutateAsync({
        id: editingEventType.id,
        updates: {
          ...data,
          price_amount: data.price_amount || null,
        },
      });
      toast.success("Event type updated successfully");
      setIsEditSheetOpen(false);
      setEditingEventType(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update event type");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateSubmit = async (data: z.infer<typeof eventTypeSchema>) => {
    if (!currentUser?.id) {
      toast.error("You must be logged in to create event types");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await createEventType.mutateAsync({
        ...data,
        price_amount: data.price_amount || null,
        owner_user_id: currentUser.id, // Use current admin user as owner
      });

      if (result?.success) {
        console.log("Event type created successfully:", result.data);
        setIsCreateSheetOpen(false);
        createForm.reset();
        // Force immediate refetch
        try {
          const refetchResult = await refetch();
          console.log("Refetch after create result:", refetchResult);
        } catch (refetchError) {
          console.error("Refetch error after create:", refetchError);
        }
      } else {
        console.error("Failed to create event type - result:", result);
        console.error("Failed to create event type - error:", result?.error);
        toast.error(result?.error || "Failed to create event type. Check console for details.");
      }
    } catch (error: any) {
      console.error("Error creating event type - exception:", error);
      console.error("Error creating event type - stack:", error?.stack);
      toast.error(error?.message || "Failed to create event type. Check console for details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (selectedEventType) {
      await deleteEventType.mutateAsync(selectedEventType.id);
      setShowDeleteDialog(false);
      setSelectedEventType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Event Types</h1>
          <p className="text-muted-foreground mt-2">Manage all event types</p>
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
          <h1 className="text-3xl font-bold">Event Types</h1>
          <p className="text-muted-foreground mt-2">
            Manage all event types ({filteredEventTypes.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              console.log("Refresh button clicked");
              try {
                // Clear cache and force refetch
                queryClient.removeQueries({ queryKey: ["event-types"] });
                const result = await refetch();
                console.log("Refetch result:", result);
                console.log("Refetch data:", result.data);
                toast.success(`Refreshed: ${result.data?.length || 0} event types`);
              } catch (error) {
                console.error("Refetch error:", error);
                toast.error("Failed to refresh event types");
              }
            }}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Event Type
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by title, slug, or owner email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Event Types List - Responsive (No Scrolling) */}
      <ResponsiveList
        mobileView={
          error ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="text-destructive">
                <p className="font-medium">Error loading event types</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error.message || "Failed to load event types"}
                </p>
              </div>
            </div>
          ) : filteredEventTypes.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
              {eventTypes.length === 0
                ? "No event types found"
                : "No event types match your search"}
            </div>
          ) : (
            filteredEventTypes.map((et) => (
              <ResponsiveCard
                key={et.id}
                onClick={() => setSelectedEventType(et)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{et.title}</div>
                    <div className="text-sm text-muted-foreground">{et.slug}</div>
                  </div>
                  <Badge
                    className={
                      et.is_active
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }
                  >
                    {et.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <ResponsiveCardGrid columns={2} className="pt-2 border-t border-border">
                  <ResponsiveCardRow
                    label="Duration"
                    value={
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {et.duration_minutes} min
                      </div>
                    }
                  />
                  <ResponsiveCardRow
                    label="Owner"
                    value={et.owner?.email || "Unknown"}
                  />
                  {et.price_amount && (
                    <ResponsiveCardRow
                      label="Price"
                      value={
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {et.price_amount} {et.price_currency || "EUR"}
                        </div>
                      }
                    />
                  )}
                </ResponsiveCardGrid>
              </ResponsiveCard>
            ))
          )
        }
        desktopView={
          error ? (
            <div className="p-8 text-center">
              <div className="text-destructive">
                <p className="font-medium">Error loading event types</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error.message || "Failed to load event types"}
                </p>
              </div>
            </div>
          ) : filteredEventTypes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {eventTypes.length === 0
                ? "No event types found"
                : "No event types match your search"}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredEventTypes.map((et) => (
                <div
                  key={et.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEventType(et)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{et.title}</div>
                          {et.description && (
                            <div className="text-sm text-muted-foreground truncate mt-1">
                              {et.description}
                            </div>
                          )}
                        </div>
                        <code className="text-sm bg-muted px-2 py-1 rounded shrink-0">
                          {et.slug}
                        </code>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {et.duration_minutes} min
                        </div>
                        <div>{et.owner?.email || "Unknown"}</div>
                        {et.price_amount && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {et.price_amount} {et.price_currency || "EUR"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <Switch
                        checked={et.is_active}
                        onCheckedChange={(checked) => {
                          handleUpdateStatus(et.id, checked);
                        }}
                        disabled={isUpdating}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Badge
                        className={
                          et.is_active
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }
                      >
                        {et.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      />

      {/* Event Type Detail Sheet */}
      <Sheet
        open={!!selectedEventType && !showDeleteDialog && !isEditSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEventType(null);
          }
        }}
      >
        <SheetContent className="sm:max-w-2xl flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Event Type Details</SheetTitle>
            <SheetDescription>View event type information</SheetDescription>
          </SheetHeader>
          {selectedEventType && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex gap-2 pb-4 border-b shrink-0">
                <Button
                  variant="default"
                  onClick={() => {
                    const eventTypeToEdit = selectedEventType;
                    setSelectedEventType(null);
                    openEditDialog(eventTypeToEdit);
                  }}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event Type
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Title</div>
                  <div className="mt-1 font-medium">{selectedEventType.title}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Slug</div>
                  <div className="mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {selectedEventType.slug}
                    </code>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="mt-1 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedEventType.duration_minutes} minutes
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1">
                    <Badge
                      className={
                        selectedEventType.is_active
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }
                    >
                      {selectedEventType.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Owner</div>
                  <div className="mt-1">{selectedEventType.owner?.email || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Company</div>
                  <div className="mt-1">
                    {selectedEventType.company?.name || "None"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location Type</div>
                  <div className="mt-1 capitalize">{selectedEventType.location_type}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Minimum Notice</div>
                  <div className="mt-1">{selectedEventType.minimum_notice_hours} hours</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Booking Window</div>
                  <div className="mt-1">{selectedEventType.booking_window_days} days</div>
                </div>
                {selectedEventType.price_amount && (
                  <div>
                    <div className="text-sm text-muted-foreground">Price</div>
                    <div className="mt-1 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {selectedEventType.price_amount}{" "}
                      {selectedEventType.price_currency || "EUR"}
                    </div>
                  </div>
                )}
              </div>
              {selectedEventType.description && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Description</div>
                  <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {selectedEventType.description}
                  </div>
                </div>
              )}
              {selectedEventType.location_value && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Location</div>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {selectedEventType.location_value}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Event Type Sheet */}
      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent className="sm:max-w-2xl flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Create New Event Type</SheetTitle>
            <SheetDescription>
              Create a new event type for scheduling
            </SheetDescription>
          </SheetHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(handleCreateSubmit)}
              className="flex flex-col h-full overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto space-y-6 py-6">
              <div className="space-y-4">
                {currentUser && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="font-medium">Owner</div>
                    <div className="text-muted-foreground">
                      {currentUser.email} (Cenety Platform)
                    </div>
                  </div>
                )}

                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Event type title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="event-type-slug"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        URL-friendly identifier (lowercase, numbers, hyphens only)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Event description"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={480}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 30)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-end">
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Active</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="buffer_before_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buffer Before (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="buffer_after_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buffer After (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="location_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="google_meet">Google Meet</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="custom_link">Custom Link</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="in_person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="location_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Value</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="URL, address, or phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="minimum_notice_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Notice (hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="booking_window_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Window (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 30)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="price_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="price_currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || "EUR"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              </div>

              <SheetFooter className="shrink-0 border-t pt-4 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateSheetOpen(false);
                    createForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? "Creating..." : "Create Event Type"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Edit Event Type Sheet */}
      <Sheet 
        open={isEditSheetOpen} 
        onOpenChange={(open) => {
          setIsEditSheetOpen(open);
          if (!open) {
            setEditingEventType(null);
          }
        }}
      >
        <SheetContent className="sm:max-w-2xl flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Edit Event Type</SheetTitle>
            <SheetDescription>
              Update event type details and settings
            </SheetDescription>
          </SheetHeader>
          {editingEventType && (
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleEditSubmit)}
                className="flex flex-col h-full overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto space-y-6 py-6">
                  <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Event type title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="event-type-slug"
                            className="font-mono"
                          />
                        </FormControl>
                        <FormDescription>
                          URL-friendly identifier (lowercase, numbers, hyphens only)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Event description"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="duration_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={480}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 30)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Active</FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="buffer_before_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer Before (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="buffer_after_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer After (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="location_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="google_meet">Google Meet</SelectItem>
                            <SelectItem value="zoom">Zoom</SelectItem>
                            <SelectItem value="custom_link">Custom Link</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="in_person">In Person</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="location_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Value</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="URL, address, or phone number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="minimum_notice_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Notice (hours)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="booking_window_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking Window (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 30)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="price_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                              placeholder="0.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="price_currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "EUR"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  </div>
                </div>

                <SheetFooter className="shrink-0 border-t pt-4 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditSheetOpen(false);
                      setEditingEventType(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    <Save className="h-4 w-4 mr-2" />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedEventType?.title}"? This action
              cannot be undone and will affect all associated bookings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedEventType(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
