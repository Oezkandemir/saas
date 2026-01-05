"use client";

import { useEffect, useState } from "react";
import {
  getDeviceStatistics,
  getGeolocationStats,
  getRealtimeActiveUsers,
  getRealtimePageViews,
} from "@/actions/analytics-actions";
import { formatDistanceToNow } from "date-fns";
import { Activity, Globe, MapPin, Monitor, Users } from "lucide-react";

import { logger } from "@/lib/logger";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import { useSupabase } from "@/components/supabase-provider";

interface ActiveUser {
  user_id: string | null;
  session_id: string;
  page_path: string;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  last_activity: string;
  duration_seconds: number;
}

interface PageView {
  page_path: string;
  view_count: number;
  unique_visitors: number;
  avg_duration: number | null;
  countries: string[] | null;
}

interface GeolocationStat {
  country: string;
  city: string | null;
  region: string | null;
  user_count: number;
  page_views: number;
  avg_session_duration: number | null;
}

interface DeviceStat {
  device_type: string;
  browser: string;
  browser_version: string | null;
  os: string;
  os_version: string | null;
  screen_resolution: string;
  user_count: number;
  page_views: number;
  avg_duration: number | null;
}

export function RealtimeAnalytics() {
  const { supabase } = useSupabase();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [geolocationStats, setGeolocationStats] = useState<GeolocationStat[]>(
    [],
  );
  const [deviceStats, setDeviceStats] = useState<DeviceStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [usersResult, viewsResult, geoResult, deviceResult] =
          await Promise.allSettled([
            getRealtimeActiveUsers(),
            getRealtimePageViews(),
            getGeolocationStats(7),
            getDeviceStatistics(7),
          ]);

        if (usersResult.status === "fulfilled" && usersResult.value.success) {
          setActiveUsers(usersResult.value.data || []);
        }
        if (viewsResult.status === "fulfilled" && viewsResult.value.success) {
          setPageViews(viewsResult.value.data || []);
        }
        if (geoResult.status === "fulfilled" && geoResult.value.success) {
          setGeolocationStats(geoResult.value.data || []);
        }
        if (deviceResult.status === "fulfilled" && deviceResult.value.success) {
          setDeviceStats(deviceResult.value.data || []);
        }
      } catch (error) {
        logger.error("Error fetching realtime analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!supabase) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      try {
        channel = supabase
          .channel("realtime-analytics", {
            config: {
              broadcast: { self: false },
              presence: { key: "" },
            },
          })
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "page_views",
            },
            async () => {
              // Refresh data when new page view is inserted
              try {
                const [usersResult, viewsResult] = await Promise.allSettled([
                  getRealtimeActiveUsers(),
                  getRealtimePageViews(),
                ]);
                if (
                  usersResult.status === "fulfilled" &&
                  usersResult.value.success
                ) {
                  setActiveUsers(usersResult.value.data || []);
                }
                if (
                  viewsResult.status === "fulfilled" &&
                  viewsResult.value.success
                ) {
                  setPageViews(viewsResult.value.data || []);
                }
              } catch (error) {
                logger.error("Error refreshing realtime data:", error);
              }
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              logger.debug("Realtime analytics subscribed");
            } else if (status === "CHANNEL_ERROR") {
              logger.warn("Realtime channel error, will retry on next refresh");
            }
          });
      } catch (error) {
        logger.error("Error setting up realtime:", error);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(console.error);
      }
    };
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Real-time Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers.length}</div>
            <p className="text-xs text-muted-foreground">Letzte 5 Minuten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pageViews.reduce((sum, pv) => sum + pv.view_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Letzte Stunde</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Länder</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geolocationStats.length}</div>
            <p className="text-xs text-muted-foreground">Letzte 7 Tage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geräte-Typen</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(deviceStats.map((d) => d.device_type)).size}
            </div>
            <p className="text-xs text-muted-foreground">Verschiedene Geräte</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive User (Live)</CardTitle>
          <CardDescription>
            User, die in den letzten 5 Minuten aktiv waren
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seite</TableHead>
                  <TableHead>Standort</TableHead>
                  <TableHead>Gerät</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Letzte Aktivität</TableHead>
                  <TableHead>Dauer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeUsers.slice(0, 20).map((user, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">
                      {user.page_path.length > 30
                        ? `${user.page_path.substring(0, 30)}...`
                        : user.page_path}
                    </TableCell>
                    <TableCell>
                      {user.city && user.country ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">
                            {user.city}, {user.country}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {user.device_type || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {user.browser} {user.os ? `(${user.os})` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.last_activity), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-xs">
                      {Math.floor(user.duration_seconds / 60)}m{" "}
                      {user.duration_seconds % 60}s
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Keine aktiven User im Moment
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Pages */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Seiten (Live)</CardTitle>
            <CardDescription>Letzte Stunde</CardDescription>
          </CardHeader>
          <CardContent>
            {pageViews.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seite</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Unique</TableHead>
                    <TableHead>Ø Dauer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageViews.slice(0, 10).map((pv, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">
                        {pv.page_path.length > 40
                          ? `${pv.page_path.substring(0, 40)}...`
                          : pv.page_path}
                      </TableCell>
                      <TableCell>{pv.view_count}</TableCell>
                      <TableCell>{pv.unique_visitors}</TableCell>
                      <TableCell>
                        {pv.avg_duration
                          ? `${Math.floor(pv.avg_duration)}s`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Keine Page Views im Moment
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geolocation Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Top Standorte</CardTitle>
            <CardDescription>Letzte 7 Tage</CardDescription>
          </CardHeader>
          <CardContent>
            {geolocationStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Land</TableHead>
                    <TableHead>Stadt</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geolocationStats.slice(0, 10).map((geo, index) => (
                    <TableRow key={index}>
                      <TableCell>{geo.country}</TableCell>
                      <TableCell>{geo.city || "-"}</TableCell>
                      <TableCell>{geo.user_count}</TableCell>
                      <TableCell>{geo.page_views}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Keine Geolocation-Daten verfügbar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Geräte-Statistiken</CardTitle>
          <CardDescription>Detaillierte Geräte-Informationen</CardDescription>
        </CardHeader>
        <CardContent>
          {deviceStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gerät</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Auflösung</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deviceStats.slice(0, 15).map((device, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline">{device.device_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {device.browser}
                      {device.browser_version
                        ? ` ${device.browser_version}`
                        : ""}
                    </TableCell>
                    <TableCell className="text-xs">
                      {device.os}
                      {device.os_version ? ` ${device.os_version}` : ""}
                    </TableCell>
                    <TableCell className="text-xs">
                      {device.screen_resolution}
                    </TableCell>
                    <TableCell>{device.user_count}</TableCell>
                    <TableCell>{device.page_views}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Keine Geräte-Daten verfügbar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
