import { useState, useMemo, useEffect } from "react";
import {
  useBookings,
  useBookingAnalytics,
  useCancelBooking,
} from "../hooks/useBookings";
import { Booking, BookingStatus } from "../api/admin-bookings";
import {
  Search,
  Calendar,
  XCircle,
  CheckCircle,
  Clock,
  User,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";

export default function BookingsPage() {
  const { data: bookingsResponse, isLoading, error } = useBookings();
  const { data: analyticsResponse } = useBookingAnalytics();
  const cancelBooking = useCancelBooking();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const bookings = bookingsResponse?.data || [];
  const analytics = analyticsResponse?.data;

  // Debug: Log the response
  useEffect(() => {
    if (bookingsResponse) {
      console.log("Bookings Response:", bookingsResponse);
      console.log("Bookings:", bookings);
      console.log("Bookings length:", bookings.length);
    }
    if (error) {
      console.error("Error loading bookings:", error);
    }
  }, [bookingsResponse, bookings, error]);

  // Filter and search bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.invitee_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        booking.invitee_email
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        booking.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const getStatusBadgeColor = (status: BookingStatus) => {
    switch (status) {
      case "scheduled":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "canceled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleCancel = async () => {
    if (selectedBooking) {
      await cancelBooking.mutateAsync({
        id: selectedBooking.id,
        reason: cancelReason || undefined,
      });
      setShowCancelDialog(false);
      setSelectedBooking(null);
      setCancelReason("");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground mt-2">Manage all bookings</p>
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
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground mt-2">
          Manage all bookings ({filteredBookings.length} bookings)
        </p>
      </div>

      {/* Stats Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Total Bookings</div>
            <div className="text-2xl font-bold mt-1">{analytics.total}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Scheduled</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {analytics.scheduled}
            </div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Upcoming</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              <Clock className="h-5 w-5 text-blue-500" />
              {analytics.upcoming}
            </div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Today</div>
            <div className="text-2xl font-bold mt-1">{analytics.today}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by invitee name, email, or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List - Mobile Card View */}
      <div className="md:hidden space-y-4">
        {error ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="text-destructive">
              <p className="font-medium">Error loading bookings</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message || "Failed to load bookings"}
              </p>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            {bookings.length === 0 ? "No bookings found" : "No bookings match your filters"}
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBooking(booking);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{booking.invitee_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {booking.invitee_email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Event Type</div>
                  <div className="text-sm">
                    {booking.event_type?.title || "Unknown"}
                  </div>
                  {booking.event_type?.duration_minutes && (
                    <div className="text-xs text-muted-foreground">
                      {booking.event_type.duration_minutes} min
                    </div>
                  )}
                  {booking.number_of_participants > 1 && (
                    <div className="text-xs text-muted-foreground">
                      {booking.number_of_participants} participants
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <Badge
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Date & Time</div>
                  <div className="text-sm">
                    {new Date(booking.start_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(booking.start_at).toLocaleTimeString()} -{" "}
                    {new Date(booking.end_at).toLocaleTimeString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Host</div>
                  <div className="text-sm">{booking.user?.email || "Unknown"}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bookings Table - Desktop View */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Invitee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Host
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center"
                  >
                    <div className="text-destructive">
                      <p className="font-medium">Error loading bookings</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {error.message || "Failed to load bookings"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    {bookings.length === 0 ? "No bookings found" : "No bookings match your filters"}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr 
                    key={booking.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={(e) => {
                      // Don't open drawer if clicking buttons
                      if ((e.target as HTMLElement).closest('button')) {
                        return;
                      }
                      setSelectedBooking(booking);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{booking.invitee_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.invitee_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {booking.event_type?.title || "Unknown"}
                      </div>
                      {booking.event_type?.duration_minutes && (
                        <div className="text-xs text-muted-foreground">
                          {booking.event_type.duration_minutes} min
                        </div>
                      )}
                      {booking.number_of_participants > 1 && (
                        <div className="text-xs text-muted-foreground">
                          {booking.number_of_participants} participants
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm">
                            {new Date(booking.start_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(booking.start_at).toLocaleTimeString()} -{" "}
                            {new Date(booking.end_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{booking.user?.email || "Unknown"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(booking);
                          }}
                        >
                          View
                        </Button>
                        {booking.status === "scheduled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                              setShowCancelDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* Booking Detail Drawer */}
      <Sheet
        open={!!selectedBooking && !showCancelDialog}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
            <SheetDescription>View booking information</SheetDescription>
          </SheetHeader>
          {selectedBooking && (
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Invitee</div>
                  <div className="mt-1 font-medium">
                    {selectedBooking.invitee_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedBooking.invitee_email}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Host</div>
                  <div className="mt-1">{selectedBooking.user?.email || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Event Type</div>
                  <div className="mt-1">
                    {selectedBooking.event_type?.title || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge
                    className={`mt-1 ${getStatusBadgeColor(
                      selectedBooking.status
                    )}`}
                  >
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Start</div>
                  <div className="mt-1">
                    {new Date(selectedBooking.start_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">End</div>
                  <div className="mt-1">
                    {new Date(selectedBooking.end_at).toLocaleString()}
                  </div>
                </div>
              </div>
              {selectedBooking.number_of_participants > 1 && (
                <div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                  <div className="mt-1">
                    {selectedBooking.number_of_participants} participant{selectedBooking.number_of_participants > 1 ? 's' : ''}
                  </div>
                  {selectedBooking.participant_names && selectedBooking.participant_names.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedBooking.participant_names.map((name, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground">
                          • {name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {selectedBooking.time_slot && (
                <div>
                  <div className="text-sm text-muted-foreground">Time Slot</div>
                  <div className="mt-1">
                    {selectedBooking.time_slot.start_time.substring(0, 5)} - {selectedBooking.time_slot.end_time.substring(0, 5)}
                    {selectedBooking.time_slot.day_of_week !== null && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Day {selectedBooking.time_slot.day_of_week})
                      </span>
                    )}
                  </div>
                </div>
              )}
              {selectedBooking.invitee_notes && (
                <div className="md:col-span-2">
                  <div className="text-sm text-muted-foreground mb-2">Notes</div>
                  <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {selectedBooking.invitee_notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Booking Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cancel Reason (Optional)</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason("");
              }}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
            >
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
