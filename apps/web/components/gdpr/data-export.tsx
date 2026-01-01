"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { exportUserData, exportUserDataCSV } from "@/actions/gdpr-actions";

export function DataExport() {
  const t = useTranslations("GDPR");
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const result = await exportUserData();
      
      if (!result.success || !result.data) {
        toast({
          variant: "destructive",
          title: "Export fehlgeschlagen",
          description: result.message,
        });
        return;
      }

      // Create download link
      const blob = new Blob([result.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || "cenety-data-export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export erfolgreich",
        description: "Ihre Daten wurden als JSON-Datei heruntergeladen.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export fehlgeschlagen",
        description: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportUserDataCSV();
      
      if (!result.success || !result.data) {
        toast({
          variant: "destructive",
          title: "Export fehlgeschlagen",
          description: result.message,
        });
        return;
      }

      // Create separate CSV files for each category
      const data = result.data as any;
      const files = [
        { name: "customers.csv", content: data.customers },
        { name: "documents.csv", content: data.documents },
        { name: "qr-codes.csv", content: data.qrCodes },
      ];

      files.forEach((file) => {
        if (file.content) {
          const blob = new Blob([file.content], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      });

      toast({
        title: "Export erfolgreich",
        description: "Ihre Daten wurden als CSV-Dateien heruntergeladen.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export fehlgeschlagen",
        description: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Datenexport
        </CardTitle>
        <CardDescription>
          Laden Sie alle Ihre gespeicherten Daten herunter (DSGVO Art. 15 - Recht auf Auskunft)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Sie haben das Recht, eine Kopie aller Ihrer personenbezogenen Daten zu erhalten.
            Der Export umfasst:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
            <li>Ihr Benutzerprofil und Kontoinformationen</li>
            <li>Alle Kundendaten</li>
            <li>Alle Dokumente (Angebote, Rechnungen)</li>
            <li>QR-Codes und Scan-Statistiken</li>
            <li>Cookie-Einwilligungen</li>
            <li>Benachrichtigungen</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="w-full sm:w-auto"
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportiere...
              </>
            ) : (
              <>
                <FileJson className="mr-2 h-4 w-4" />
                Als JSON exportieren
              </>
            )}
          </Button>

          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="w-full sm:w-auto"
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportiere...
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Als CSV exportieren
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Hinweis:</strong> Der Export wird sofort erstellt und enthält alle aktuellen Daten.
            Die Dateien werden nicht auf unseren Servern gespeichert.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

