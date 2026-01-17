import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Settings,
  CalendarDays,
  BookOpen,
  Users,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useEventTypes } from "../hooks/useEventTypes";
import { useTimeSlots } from "../hooks/useTimeSlots";
import { useAllAvailabilityRules, useAllAvailabilityOverrides } from "../hooks/useAvailability";
import { useBookings } from "../hooks/useBookings";
import { Skeleton } from "../components/ui/skeleton";

export default function SchedulingPage() {
  const { data: eventTypesResponse, isLoading: eventTypesLoading } = useEventTypes();
  const { data: timeSlotsResponse, isLoading: timeSlotsLoading } = useTimeSlots();
  const { data: availabilityRulesResponse, isLoading: rulesLoading } = useAllAvailabilityRules();
  const { data: availabilityOverridesResponse, isLoading: overridesLoading } = useAllAvailabilityOverrides();
  const { data: bookingsResponse, isLoading: bookingsLoading } = useBookings();

  const eventTypes = eventTypesResponse?.data || [];
  const timeSlots = timeSlotsResponse?.data || [];
  const availabilityRules = availabilityRulesResponse?.data || [];
  const availabilityOverrides = availabilityOverridesResponse?.data || [];
  const bookings = bookingsResponse?.data || [];

  const activeEventTypes = eventTypes.filter((et) => et.is_active).length;
  const upcomingBookings = bookings.filter(
    (b) => b.status === "scheduled" && new Date(b.start_at) > new Date()
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scheduling Management</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive scheduling system management center
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {eventTypesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{eventTypes.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeEventTypes} active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {timeSlotsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{timeSlots.length}</div>
                <p className="text-xs text-muted-foreground">
                  Configured slots
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Availability Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{availabilityRules.length}</div>
                <p className="text-xs text-muted-foreground">
                  Weekly rules
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{upcomingBookings}</div>
                <p className="text-xs text-muted-foreground">
                  Scheduled bookings
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Types */}
        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
            <CardDescription>
              Manage event types, durations, and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{eventTypes.length}</div>
                <p className="text-sm text-muted-foreground">Total event types</p>
              </div>
              <div className="flex gap-2">
                <Link to="/scheduling/event-types">
                  <Button variant="outline" size="sm">
                    Manage
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            {eventTypesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : eventTypes.length > 0 ? (
              <div className="space-y-2">
                {eventTypes.slice(0, 3).map((et) => (
                  <div
                    key={et.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{et.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {et.duration_minutes} min • {et.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                ))}
                {eventTypes.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{eventTypes.length - 3} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No event types found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle>Time Slots</CardTitle>
            <CardDescription>
              Configure available time slots for bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{timeSlots.length}</div>
                <p className="text-sm text-muted-foreground">Total time slots</p>
              </div>
              <Link to="/scheduling/time-slots">
                <Button variant="outline" size="sm">
                  Manage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {timeSlotsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="space-y-2">
                {timeSlots.slice(0, 3).map((ts) => (
                  <div
                    key={ts.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {ts.start_time.substring(0, 5)} - {ts.end_time.substring(0, 5)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ts.day_of_week !== null
                          ? `Day ${ts.day_of_week}`
                          : "All days"}
                        {ts.max_participants && ` • Max ${ts.max_participants}`}
                      </div>
                    </div>
                  </div>
                ))}
                {timeSlots.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{timeSlots.length - 3} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No time slots found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Availability Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Availability Rules</CardTitle>
            <CardDescription>
              Set weekly availability schedules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{availabilityRules.length}</div>
                <p className="text-sm text-muted-foreground">Weekly rules</p>
              </div>
              <Link to="/scheduling/availability-rules">
                <Button variant="outline" size="sm">
                  Manage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {rulesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : availabilityRules.length > 0 ? (
              <div className="space-y-2">
                {availabilityRules.slice(0, 3).map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        Day {rule.day_of_week}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rule.start_time.substring(0, 5)} - {rule.end_time.substring(0, 5)}
                      </div>
                    </div>
                  </div>
                ))}
                {availabilityRules.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{availabilityRules.length - 3} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No availability rules found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Date Overrides */}
        <Card>
          <CardHeader>
            <CardTitle>Date Overrides</CardTitle>
            <CardDescription>
              Manage date-specific availability exceptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{availabilityOverrides.length}</div>
                <p className="text-sm text-muted-foreground">Date overrides</p>
              </div>
              <Link to="/scheduling/date-overrides">
                <Button variant="outline" size="sm">
                  Manage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {overridesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : availabilityOverrides.length > 0 ? (
              <div className="space-y-2">
                {availabilityOverrides.slice(0, 3).map((override) => (
                  <div
                    key={override.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {new Date(override.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {override.is_unavailable ? "Unavailable" : "Available"}
                        {override.start_time &&
                          override.end_time &&
                          ` • ${override.start_time.substring(0, 5)} - ${override.end_time.substring(0, 5)}`}
                      </div>
                    </div>
                  </div>
                ))}
                {availabilityOverrides.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{availabilityOverrides.length - 3} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No date overrides found
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common scheduling management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link to="/scheduling/event-types">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Event Types
              </Button>
            </Link>
            <Link to="/scheduling/time-slots">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Time Slots
              </Button>
            </Link>
            <Link to="/scheduling/availability-rules">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Availability Rules
              </Button>
            </Link>
            <Link to="/scheduling/date-overrides">
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="mr-2 h-4 w-4" />
                Date Overrides
              </Button>
            </Link>
            <Link to="/bookings">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                View Bookings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
