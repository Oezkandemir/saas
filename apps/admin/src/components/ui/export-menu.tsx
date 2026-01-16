import { Download, FileText, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface ExportMenuProps {
  onExportCSV?: () => void;
  onExportJSON?: () => void;
  onExportExcel?: () => void;
  filename?: string;
  disabled?: boolean;
}

export function ExportMenu({
  onExportCSV,
  onExportJSON,
  onExportExcel,
  filename = "export",
  disabled = false,
}: ExportMenuProps) {
  const hasAnyExport = onExportCSV || onExportJSON || onExportExcel;

  if (!hasAnyExport) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {onExportCSV && (
          <DropdownMenuItem onClick={onExportCSV}>
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
        )}
        {onExportJSON && (
          <DropdownMenuItem onClick={onExportJSON}>
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
        )}
        {onExportExcel && (
          <DropdownMenuItem onClick={onExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as Excel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
