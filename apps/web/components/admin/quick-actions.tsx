"use client";

import { Loader2, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import {
  clearOldErrors,
  optimizeDatabase,
  type QuickActionResult,
} from "@/actions/admin-system-actions";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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
      icon: <Trash2 className="size-4" />,
      variant: "destructive",
      requiresConfirmation: true,
      action: async () => await clearOldErrors(30),
    },
    {
      id: "optimize-database",
      title: "Datenbank optimieren",
      description: "Führt ANALYZE aus, um Statistiken zu aktualisieren",
      icon: <Zap className="size-4" />,
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
        description:
          error instanceof Error ? error.message : "Aktion fehlgeschlagen",
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
              <AlertDialog key={action.id}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={action.variant}
                    className="justify-start py-3 w-full h-auto"
                    disabled={isLoading}
                  >
                    <div className="flex gap-3 items-center w-full">
                      <div
                        className={`p-2 rounded-md ${
                          action.variant === "destructive"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {action.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs opacity-70 mt-0.5">
                          {action.description}
                        </div>
                      </div>
                      {isLoading && <Loader2 className="size-4 animate-spin" />}
                    </div>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex gap-2 items-center">
                      {action.icon}
                      {action.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {action.description}
                      <br />
                      <br />
                      <strong>
                        Möchten Sie diese Aktion wirklich ausführen?
                      </strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleAction(action)}
                      disabled={isLoading}
                      className={
                        action.variant === "destructive"
                          ? "bg-destructive hover:bg-destructive/90"
                          : ""
                      }
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Wird ausgeführt...
                        </>
                      ) : (
                        "Bestätigen"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          }

          return (
            <Button
              key={action.id}
              variant={action.variant}
              className="justify-start py-3 w-full h-auto"
              onClick={() => handleAction(action)}
              disabled={isLoading}
            >
              <div className="flex gap-3 items-center w-full">
                <div
                  className={`p-2 rounded-md ${
                    action.variant === "destructive"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {action.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {action.description}
                  </div>
                </div>
                {isLoading && loadingAction === action.id && (
                  <Loader2 className="size-4 animate-spin" />
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
