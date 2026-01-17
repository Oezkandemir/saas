import { LucideIcon } from "lucide-react";
import { EmptyState } from "./empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface EmptyTableProps {
  columns: number;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyTable({
  columns,
  icon,
  title = "No data available",
  description,
  action,
}: EmptyTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i} />
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={columns} className="h-64">
            <div className="flex items-center justify-center">
              <EmptyState
                icon={icon}
                title={title}
                description={description}
                action={action}
              />
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
