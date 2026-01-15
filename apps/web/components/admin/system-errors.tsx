"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  deleteAllErrors,
  getRecentErrors,
  resolveError,
  type SystemErrorRecord,
} from "@/actions/system-monitoring-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function SystemErrors() {
  const { toast } = useToast();
  const [errors, setErrors] = useState<SystemErrorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const loadErrors = async () => {
    setIsLoading(true);
    try {
      const result = await getRecentErrors(50);
      if (result.success) {
        setErrors(result.errors);
      } else {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: result.message,
        });
      }
    } catch (_error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Fehler konnten nicht geladen werden",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadErrors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResolve = async (errorId: string) => {
    setResolvingId(errorId);
    try {
      const result = await resolveError(errorId);
      if (result.success) {
        toast({
          title: "Fehler behoben",
          description: "Der Fehler wurde als behoben markiert",
        });
        loadErrors();
      } else {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: result.message,
        });
      }
    } catch (_error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Fehler konnte nicht behoben werden",
      });
    } finally {
      setResolvingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const result = await deleteAllErrors();
      if (result.success) {
        toast({
          title: "Erfolg",
          description: result.message,
        });
        loadErrors();
      } else {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: result.message,
        });
      }
    } catch (_error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Fehler konnten nicht gelöscht werden",
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case "critical":
        return <XCircle className="size-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="size-5 text-yellow-500" />;
      case "info":
        return <Info className="size-5 text-blue-500" />;
      default:
        return <AlertCircle className="size-5 text-gray-500" />;
    }
  };

  const getErrorBadge = (errorType: string) => {
    switch (errorType) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return (
          <Badge variant="default" className="bg-yellow-500">
            Warning
          </Badge>
        );
      case "info":
        return (
          <Badge variant="default" className="bg-blue-500">
            Info
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System-Fehler</CardTitle>
          <CardDescription>Laden...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const unresolvedErrors = errors.filter((e) => !e.resolved);
  const criticalErrors = unresolvedErrors.filter(
    (e) => e.errorType === "critical"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">
            Fehler-Übersicht
          </h4>
        </div>
        {errors.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeletingAll}>
                {isDeletingAll ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Löschen...
                  </>
                ) : (
                  "Alle löschen"
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alle Systemfehler löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion löscht alle Systemfehler permanent aus der
                  Datenbank. Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAll}
                  className={cn(buttonVariants({ variant: "destructive" }))}
                >
                  Alle löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Gesamt</p>
            <p className="text-2xl font-bold">{errors.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Kritisch</p>
            <p className="text-2xl font-bold text-red-500">
              {criticalErrors.length}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Offen</p>
            <p className="text-2xl font-bold text-yellow-500">
              {unresolvedErrors.length}
            </p>
          </div>
        </div>

        {/* Error List */}
        {errors.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="mx-auto size-12 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              Keine Fehler gefunden
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {errors.map((error) => (
              <div
                key={error.id}
                className={`flex items-start justify-between gap-4 rounded-lg border p-3 ${
                  error.resolved ? "opacity-60" : ""
                }`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getErrorIcon(error.errorType)}
                    <span className="font-medium capitalize">
                      {error.component}
                    </span>
                    {getErrorBadge(error.errorType)}
                    {error.resolved && (
                      <Badge variant="outline" className="text-xs">
                        Behoben
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{error.errorMessage}</p>
                  {error.errorStack && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Stack Trace anzeigen
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {error.errorStack}
                      </pre>
                    </details>
                  )}
                  {error.context && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Kontext anzeigen
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </details>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(error.createdAt), "PPp", { locale: de })}
                  </p>
                </div>
                {!error.resolved && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={resolvingId === error.id}
                      >
                        {resolvingId === error.id ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Beheben...
                          </>
                        ) : (
                          "Beheben"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Fehler als behoben markieren?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Dieser Fehler wird als behoben markiert. Sie können
                          ihn später wieder öffnen, falls das Problem erneut
                          auftritt.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleResolve(error.id)}
                        >
                          Als behoben markieren
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
