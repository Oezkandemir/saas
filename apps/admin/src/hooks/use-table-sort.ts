import { useState, useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export function useTableSort<T>(
  data: T[],
  defaultSort?: SortConfig<T>
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    defaultSort || null
  );

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.direction) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });

    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key: keyof T) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" };
        } else if (current.direction === "desc") {
          return null;
        }
      }
      return { key, direction: "asc" };
    });
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
  };
}
