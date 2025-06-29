import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Shell } from "@/components/shell";

export function TeamsSkeleton() {
  return (
    <Shell className="max-w-7xl">
      <div className="space-y-8">
        {/* Overview Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-24 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Teams Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Stats skeleton */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Members preview skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex -space-x-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-8 w-8 rounded-full border-2 border-background" />
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-4">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
} 