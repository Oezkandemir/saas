import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard/header";

export default function UsersLoading() {
  return (
    <>
      <DashboardHeader
        heading="Users Management"
        text="View and manage all users in your application."
      />
      <div className="mt-8 space-y-4">
        {/* Search and filter bar */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <Skeleton className="h-10 w-64" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-md border">
          <div className="border-b">
            <Skeleton className="m-2 h-10 w-full" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="size-8 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-end space-x-2">
          <Skeleton className="h-4 w-40" />
          <div className="space-x-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </>
  );
}
