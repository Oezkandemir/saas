/**
 * Export utilities for CSV, JSON, and Excel formats
 */

export interface ExportOptions {
  filename?: string;
  headers?: string[];
  dateFormat?: (date: Date) => string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  if (data.length === 0) return;

  const { filename = "export", headers } = options;

  // Use provided headers or extract from first item
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV rows
  const rows = data.map((item) =>
    csvHeaders.map((header) => {
      const value = item[header];
      if (value === null || value === undefined) return "";
      if (value instanceof Date) {
        return options.dateFormat
          ? options.dateFormat(value)
          : value.toISOString();
      }
      // Escape quotes and wrap in quotes if contains comma or quote
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  // Combine headers and rows
  const csv = [
    csvHeaders.map((h) => `"${h}"`).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create and download file
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T>(data: T[], options: ExportOptions = {}): void {
  if (data.length === 0) return;

  const { filename = "export" } = options;

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Format datetime for export
 */
export function formatDateTimeForExport(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
