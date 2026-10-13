import { Skeleton } from "~/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeletons" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex flex-col rounded-xl border p-4 space-y-3">
          <Skeleton className="aspect-[16/10] w-full rounded-lg" />
          <div className="flex justify-between items-start pt-1">
            <div className="space-y-2 flex-1 mr-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
