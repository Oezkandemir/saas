"use client";

import { useState } from "react";
import {
  Trash2,
  Zap,
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { Button } from '@/components/alignui/actions/button';
import { useToast } from "@/components/ui/use-toast";
import {
  clearOldErrors,
  optimizeDatabase,
  type QuickActionResult,
} from "@/actions/admin-system-actions";
import {
  AlertDialogRoot,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/alignui/overlays/alert-dialog";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: "default" | "destructive" | "outline";
  action: () => Promise<QuickActionResult>;
  requiresConfirmation: boolean;
}

export function QuickActions() {
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const actions: QuickAction[] = [
    {
      id: "clear-old-errors",
      title: "Alte Fehler löschen",
      description: "Löscht alle Systemfehler, die älter als 30 Tage sind",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      requiresConfirmation: true,
      action: async () => await clearOldErrors(30),
    },
    {
      id: "optimize-database",
      title: "Datenbank optimieren",
      description: "Führt ANALYZE aus, um Statistiken zu aktualisieren",
      icon: <Zap className="h-4 w-4" />,
      variant: "default",
      requiresConfirmation: true,
      action: async () => await optimizeDatabase(),
    },
  ];

  const handleAction = async (action: QuickAction) => {
    setLoadingAction(action.id);
    try {
      const result = await action.action();
      if (result.success) {
        toast({
          title: "Erfolg",
          description: result.message,
        });
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
        description: error instanceof Error ? error.message : "Aktion fehlgeschlagen",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4">
        <div className="space-y-2">
          {actions.map((action) => {
            const isLoading = loadingAction === action.id;

            if (action.requiresConfirmation) {
              return (
                <AlertDialogRoot key={action.id}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={action.variant}
                      className="w-full justify-start h-auto py-3"
                      disabled={isLoading}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`p-2 rounded-md ${
                          action.variant === "destructive" 
                            ? "bg-destructive/10 text-destructive" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {action.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-xs opacity-70 mt-0.5">
                            {action.description}
                          </div>
                        </div>
                        {isLoading && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        {action.icon}
                        {action.title}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {action.description}
                        <br />
                        <br />
                        <strong>Möchten Sie diese Aktion wirklich ausführen?</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleAction(action)}
                        disabled={isLoading}
                        className={action.variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Wird ausgeführt...
                          </>
                        ) : (
                          "Bestätigen"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialogRoot>
              );
            }

            return (
              <Button
                key={action.id}
                variant={action.variant}
                className="w-full justify-start h-auto py-3"
                onClick={() => handleAction(action)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-2 rounded-md ${
                    action.variant === "destructive" 
                      ? "bg-destructive/10 text-destructive" 
                      : "bg-primary/10 text-primary"
                  }`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      {action.description}
                    </div>
                  </div>
                  {isLoading && loadingAction === action.id && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>
    </div>
  );
}

