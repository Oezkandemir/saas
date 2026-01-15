"use client";

import { Database, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type DatabaseTableStats,
  getDatabaseInfo,
  getDatabaseTableStats,
} from "@/actions/admin-system-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

export function DatabaseStats() {
  const { toast } = useToast();
  const [tableStats, setTableStats] = useState<DatabaseTableStats[]>([]);
  const [dbInfo, setDbInfo] = useState<{
    version: string;
    responseTime: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [statsResult, infoResult] = await Promise.all([
        getDatabaseTableStats(),
        getDatabaseInfo(),
      ]);

      if (statsResult.success && statsResult.data) {
        setTableStats(statsResult.data);
      } else {
        toast({
          variant: "destructive",
          title: "Fehler",
          description:
            statsResult.error ||
            "Datenbank-Statistiken konnten nicht geladen werden",
        });
      }

      if (infoResult.success && infoResult.data) {
        setDbInfo({
          version: infoResult.data.version,
          responseTime: infoResult.data.responseTime || 0,
        });
      }
    } catch (_error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Statistiken konnten nicht geladen werden",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadStats();
      toast({
        title: "Aktualisiert",
        description: "Datenbank-Statistiken wurden aktualisiert",
      });
    } catch (_error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Statistiken konnten nicht aktualisiert werden",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datenbank-Statistiken</CardTitle>
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
            Datenbank-Informationen
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
      <div className="space-y-6">
        {/* Database Info */}
        {dbInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border p-4 bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Version</p>
              <p className="text-lg font-semibold">{dbInfo.version}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Antwortzeit</p>
              <p className="text-lg font-semibold">{dbInfo.responseTime}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tabellen</p>
              <p className="text-lg font-semibold">{tableStats.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Gesamt Zeilen
              </p>
              <p className="text-lg font-semibold">
                {tableStats
                  .reduce((sum, stat) => sum + stat.rowCount, 0)
                  .toLocaleString("de-DE")}
              </p>
            </div>
          </div>
        )}

        {/* Table Stats */}
        {tableStats.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Tabelle</TableHead>
                    <TableHead className="text-right">Zeilen</TableHead>
                    <TableHead className="text-right">Tabellengröße</TableHead>
                    <TableHead className="text-right">Indexgröße</TableHead>
                    <TableHead className="text-right">Gesamtgröße</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableStats.map((stat) => (
                    <TableRow key={stat.tableName}>
                      <TableCell className="font-medium">
                        <span className="font-mono text-sm">
                          {stat.tableName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">
                          {stat.rowCount.toLocaleString("de-DE")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {stat.tableSize}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {stat.indexSize}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {stat.totalSize}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <Database className="size-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Keine Statistiken verfügbar</p>
            <p className="text-sm mt-1">
              Die Datenbank-Statistiken werden geladen...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
