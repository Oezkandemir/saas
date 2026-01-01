"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ColumnDef } from "@tanstack/react-table";

// Dynamic import for heavy DataTable component with SSR disabled
const DataTable = dynamic(() => import("@/components/admin/users/data-table").then(mod => ({ default: mod.DataTable })), {
  loading: () => <div className="p-6 text-center text-muted-foreground">Loading table...</div>,
  ssr: false,
}) as <TData, TValue>(props: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  locale?: string;
}) => React.ReactElement;

interface DataTableWrapperProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  locale?: string;
}

export function DataTableWrapper<TData, TValue>({
  columns,
  data,
  locale,
}: DataTableWrapperProps<TData, TValue>) {
  return <DataTable columns={columns} data={data} locale={locale} />;
}

