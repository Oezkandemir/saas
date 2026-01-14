"use client";

import { useEffect, useState } from "react";
import {
  getSystemMetrics,
  type SystemMetrics,
} from "@/actions/admin-system-actions";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, RefreshCw, TrendingUp } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SystemMetricsComponent() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const result = await getSystemMetrics();
      if (result.success && result.data) {
        setMetrics(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: result.error || "Metriken konnten nicht geladen werden",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Metriken konnten nicht geladen werden",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadMetrics();
      toast({
        title: "Aktualisiert",
        description: "System-Metriken wurden aktualisiert",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Metriken konnten nicht aktualisiert werden",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Group metrics by component
  const metricsByComponent = metrics.reduce(
    (acc, metric) => {
      if (!acc[metric.component]) {
        acc[metric.component] = [];
      }
      acc[metric.component].push(metric);
      return acc;
    },
    {} as Record<string, SystemMetrics[]>,
  );

  // Get latest metrics for each component
  const latestMetrics = Object.entries(metricsByComponent).map(
    ([component, componentMetrics]) => {
      const latest = componentMetrics[0]; // Already sorted by date desc
      return {
        component,
        metric: latest.metricName,
        value: latest.value,
        unit: latest.unit,
        timestamp: latest.timestamp,
      };
    },
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System-Metriken</CardTitle>
          <CardDescription>Laden...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">
            Metriken der letzten 24 Stunden
          </h4>
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
      <div className="space-y-4">
        {latestMetrics.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestMetrics.slice(0, 3).map((metric) => (
                <div
                  key={`${metric.component}-${metric.metric}`}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {metric.component}
                      </p>
                      <p className="text-lg font-semibold">
                        {metric.value.toLocaleString("de-DE")} {metric.unit}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {metric.metric}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Metrics */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Detaillierte Metriken</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(metricsByComponent).map(
                  ([component, componentMetrics]) => (
                    <div key={component} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {component}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(componentMetrics[0].timestamp),
                            "PPp",
                            {
                              locale: de,
                            },
                          )}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {componentMetrics.slice(0, 3).map((metric, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {metric.metricName}
                            </span>
                            <span className="font-medium">
                              {metric.value.toLocaleString("de-DE")}{" "}
                              {metric.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Keine Metriken verfügbar
          </div>
        )}
      </div>
    </div>
  );
}
