import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
  return (
    <section className="border-b border-border">
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-between sm:py-12">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 bg-border" />
          <Skeleton className="h-6 w-64 bg-border" />
          <Skeleton className="h-4 w-48 bg-border" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-14 w-20 rounded-lg bg-border" />
            <Skeleton className="h-14 w-20 rounded-lg bg-border" />
            <Skeleton className="h-14 w-20 rounded-lg bg-border" />
          </div>
        </div>
        <Skeleton className="h-[220px] w-[220px] rounded-full bg-border" />
      </div>
    </section>
  );
}

export function StationGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="cyber-border rounded-lg p-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 bg-border" />
              <Skeleton className="h-4 w-28 bg-border" />
            </div>
            <Skeleton className="h-10 w-16 bg-border" />
          </div>
          <div className="mt-3 space-y-1.5">
            <Skeleton className="h-1.5 w-full bg-border" />
            <Skeleton className="h-1.5 w-3/4 bg-border" />
            <Skeleton className="h-1.5 w-1/2 bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}
