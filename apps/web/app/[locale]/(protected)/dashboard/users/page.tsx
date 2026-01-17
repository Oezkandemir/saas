import { Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Skeleton } from "@/components/ui/skeleton";

import { UserSearch } from "./user-search";

export const metadata: Metadata = {
  title: "Users - Dashboard",
  description: "Search and discover users",
};

function UserSearchSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>

      {/* Search bar skeleton */}
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
    </div>
  );
}

export default function UsersPage() {
  return (
    <UnifiedPageLayout
      title="Users"
      description="Search and discover users in the community"
      icon={<Users className="size-4 text-primary" />}
    >
      <Suspense fallback={<UserSearchSkeleton />}>
        <UserSearch />
      </Suspense>
    </UnifiedPageLayout>
  );
}
