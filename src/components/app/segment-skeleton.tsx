import { Skeleton } from "@/components/ui/skeleton"

export function SegmentSkeleton({
  lines = 6,
  hasHeader = true,
}: {
  lines?: number
  hasHeader?: boolean
}) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4 sm:px-6 animate-pulse">
      {hasHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      )}

      {/* Grid of cards or table skeleton */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
