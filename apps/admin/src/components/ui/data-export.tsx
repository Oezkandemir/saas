import { Download, FileText, FileJson } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface DataExportProps {
  data: any[];
  filename?: string;
  csvHeaders?: string[];
  csvMapper?: (item: any) => any[];
  jsonMapper?: (item: any) => any;
}

export function DataExport({
  data,
  filename,
  csvHeaders,
  csvMapper,
  jsonMapper,
}: DataExportProps) {
  const handleExportCSV = () => {
    if (data.length === 0) return;

    const headers = csvHeaders || Object.keys(data[0]);
    const rows = data.map((item) => {
      if (csvMapper) {
        return csvMapper(item);
      }
      return headers.map((header) => {
        const value = item[header];
        return value !== null && value !== undefined ? String(value) : "";
      });
    });

    const csv = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename || "export"}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonData = jsonMapper
      ? data.map(jsonMapper)
      : data;

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename || "export"}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
