"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { Badge } from '@/components/alignui/data-display/badge';
import { useToast } from "@/components/ui/use-toast";
import {
  getSystemStatusOverview,
  performHealthCheck,
} from "@/actions/system-monitoring-actions";

interface ComponentStatus {
  component: string;
  status: string;
  message: string | null;
  lastCheck: string;
}

export function SystemStatus() {
  const { toast } = useToast();
  const [overallStatus, setOverallStatus] = useState<
    "operational" | "degraded" | "down"
  >("operational");
  const [components, setComponents] = useState<ComponentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const result = await getSystemStatusOverview();
      if (result.success) {
        setOverallStatus(result.overallStatus);
        setComponents(result.components);
      } else {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Status konnte nicht geladen werden",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Perform health check
      await performHealthCheck();
      // Reload status
      await loadStatus();
      toast({
        title: "Status aktualisiert",
        description: "System-Status wurde erfolgreich aktualisiert",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="size-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="size-5 text-yellow-500" />;
      case "down":
        return <XCircle className="size-5 text-red-500" />;
      case "maintenance":
        return <Clock className="size-5 text-blue-500" />;
      default:
        return <AlertCircle className="size-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return (
          <Badge variant="default" className="bg-green-500">
            Operational
          </Badge>
        );
      case "degraded":
        return (
          <Badge variant="default" className="bg-yellow-500">
            Degraded
          </Badge>
        );
      case "down":
        return (
          <Badge variant="destructive">Down</Badge>
        );
      case "maintenance":
        return (
          <Badge variant="default" className="bg-blue-500">
            Maintenance
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case "operational":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "down":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Laden...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Übersicht über den aktuellen Systemstatus
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Aktualisieren...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 size-4" />
                Aktualisieren
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(overallStatus)}
            <div>
              <p className="font-semibold">Gesamtstatus</p>
              <p className="text-sm text-muted-foreground">
                {overallStatus === "operational"
                  ? "Alle Systeme funktionieren einwandfrei"
                  : overallStatus === "degraded"
                    ? "Einige Systeme haben Probleme"
                    : "Kritische Systemfehler erkannt"}
              </p>
            </div>
          </div>
          <div className={getOverallStatusColor()}>
            <p className="text-2xl font-bold">
              {overallStatus === "operational"
                ? "All Systems Operational"
                : overallStatus === "degraded"
                  ? "Degraded Performance"
                  : "System Down"}
            </p>
          </div>
        </div>

        {/* Component Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Komponenten-Status</h3>
          {components.map((component) => (
            <div
              key={component.component}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(component.status)}
                <div>
                  <p className="font-medium capitalize">{component.component}</p>
                  {component.message && (
                    <p className="text-xs text-muted-foreground">
                      {component.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Vor{" "}
                    {formatDistanceToNow(new Date(component.lastCheck), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </p>
                </div>
              </div>
              {getStatusBadge(component.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}





