"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { deleteUserAccount } from "@/actions/gdpr-actions";

export function AccountDeletion() {
  const t = useTranslations("GDPR");
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== "DELETE") {
      toast({
        variant: "destructive",
        title: "Bestätigung fehlgeschlagen",
        description: "Bitte geben Sie DELETE ein, um fortzufahren.",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteUserAccount(confirmation);
      
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Löschung fehlgeschlagen",
          description: result.message,
        });
        return;
      }

      toast({
        title: result.anonymized ? "Account anonymisiert" : "Account gelöscht",
        description: result.message,
      });

      // User will be redirected automatically by the server action
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Löschung fehlgeschlagen",
        description: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setConfirmation("");
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Account löschen
        </CardTitle>
        <CardDescription>
          Löschen Sie Ihren Account und alle zugehörigen Daten (DSGVO Art. 17 - Recht auf Vergessenwerden)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                Wichtige Hinweise zur Account-Löschung:
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-yellow-900 dark:text-yellow-100">
                <li>Diese Aktion kann nicht rückgängig gemacht werden</li>
                <li>Alle Ihre Daten werden unwiderruflich gelöscht</li>
                <li>Kunden, Dokumente, QR-Codes und Scan-Statistiken gehen verloren</li>
                <li>
                  <strong>Ausnahme:</strong> Bezahlte Rechnungen müssen aus rechtlichen Gründen 10 Jahre aufbewahrt werden.
                  In diesem Fall wird Ihr Account anonymisiert statt gelöscht.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Was passiert bei der Löschung?</p>
          <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
            <li>Ihr Benutzerkonto wird sofort deaktiviert</li>
            <li>Alle personenbezogenen Daten werden gelöscht</li>
            <li>Sie werden automatisch abgemeldet</li>
            <li>Ein Audit-Log-Eintrag wird für Compliance-Zwecke erstellt</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              Account unwiderruflich löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Account wirklich löschen?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden
                  permanent gelöscht.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="confirmation">
                    Geben Sie <strong>DELETE</strong> ein, um zu bestätigen:
                  </Label>
                  <Input
                    id="confirmation"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="font-mono"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Hinweis: Falls Sie bezahlte Rechnungen haben, die jünger als 10 Jahre sind,
                  wird Ihr Account anonymisiert statt gelöscht (gesetzliche Aufbewahrungspflicht).
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmation("")}>
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={confirmation !== "DELETE" || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lösche...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Account löschen
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

