"use client";

import { useState } from "react";
import { exportUserData, exportUserDataCSV } from "@/actions/gdpr-actions";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/alignui/actions/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";

export function DataExport() {
  const t = useTranslations("GDPR.dataExport");
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const result = await exportUserData();

      if (!result.success || !result.data) {
        toast({
          variant: "destructive",
          title: t("toast.exportFailed"),
          description: "message" in result ? result.message : t("toast.error"),
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
        title: t("toast.exportSuccess"),
        description: t("toast.exportSuccessJSON"),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("toast.exportFailed"),
        description: t("toast.error"),
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
          title: t("toast.exportFailed"),
          description: "message" in result ? result.message : t("toast.error"),
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
        title: t("toast.exportSuccess"),
        description: t("toast.exportSuccessCSV"),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("toast.exportFailed"),
        description: t("toast.error"),
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
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("intro")}</p>
          <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
            <li>{t("includes.profile")}</li>
            <li>{t("includes.customers")}</li>
            <li>{t("includes.documents")}</li>
            <li>{t("includes.qrCodes")}</li>
            <li>{t("includes.consents")}</li>
            <li>{t("includes.notifications")}</li>
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
                {t("exporting")}
              </>
            ) : (
              <>
                <FileJson className="mr-2 h-4 w-4" />
                {t("exportJSON")}
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
                {t("exporting")}
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t("exportCSV")}
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>{t("note")}</strong> {t("noteText")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
