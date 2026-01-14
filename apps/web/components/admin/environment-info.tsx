"use client";

import { useEffect, useState } from "react";
import {
  getEnvironmentInfo,
  getStorageStats,
} from "@/actions/admin-system-actions";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EnvironmentInfo() {
  const { toast } = useToast();
  const [envInfo, setEnvInfo] = useState<{
    nodeEnv: string;
    nextPublicUrl: string;
    hasServiceKey: boolean;
    hasAnonKey: boolean;
    timestamp: string;
  } | null>(null);
  const [storageStats, setStorageStats] = useState<{
    totalSize: string;
    bucketCount: number;
    buckets: Array<{
      name: string;
      size: string;
      fileCount: number;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    setIsLoading(true);
    try {
      const [envResult, storageResult] = await Promise.all([
        getEnvironmentInfo(),
        getStorageStats(),
      ]);

      if (envResult.success && envResult.data) {
        setEnvInfo(envResult.data);
      }

      if (storageResult.success && storageResult.data) {
        setStorageStats(storageResult.data);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Informationen konnten nicht geladen werden",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadInfo();
      toast({
        title: "Aktualisiert",
        description: "Umgebungsinformationen wurden aktualisiert",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Informationen konnten nicht aktualisiert werden",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Umgebungsinformationen</CardTitle>
          <CardDescription>Laden...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">
            Systemkonfiguration und Speicher
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
              <Loader2 className="mr-2 animate-spin size-4" />
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
        {/* Environment Info */}
        {envInfo && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Umgebung</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  Node Environment
                </p>
                <div className="flex gap-2 items-center mt-1">
                  <Badge
                    variant={
                      envInfo.nodeEnv === "production" ? "default" : "outline"
                    }
                  >
                    {envInfo.nodeEnv}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-sm text-muted-foreground">App URL</p>
                <p className="mt-1 text-sm font-medium truncate">
                  {envInfo.nextPublicUrl}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <p className="text-sm text-muted-foreground">Service Key</p>
                <div className="flex gap-2 items-center mt-1">
                  {envInfo.hasServiceKey ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">Gesetzt</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">
                        Nicht gesetzt
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-sm text-muted-foreground">Anon Key</p>
                <div className="flex gap-2 items-center mt-1">
                  {envInfo.hasAnonKey ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">Gesetzt</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">
                        Nicht gesetzt
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Storage Stats */}
        {storageStats && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Speicher</h3>
            <div className="p-4 rounded-lg border">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamtgröße</p>
                  <p className="text-2xl font-bold">{storageStats.totalSize}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Buckets</p>
                  <p className="text-2xl font-bold">
                    {storageStats.bucketCount}
                  </p>
                </div>
              </div>
              {storageStats.buckets.length > 0 && (
                <div className="mt-4 space-y-2">
                  {storageStats.buckets.map((bucket) => (
                    <div
                      key={bucket.name}
                      className="flex justify-between items-center p-2 rounded border"
                    >
                      <div>
                        <p className="text-sm font-medium">{bucket.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bucket.fileCount} Dateien
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{bucket.size}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
