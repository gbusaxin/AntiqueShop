export function SkeletonCard() {
  return (
    <div aria-hidden="true">
      <div className="skeleton-shimmer aspect-[4/5] animate-shimmer" />
      <div className="skeleton-shimmer mt-5 h-2.5 w-1/4 animate-shimmer" />
      <div className="skeleton-shimmer mt-3 h-5 w-4/5 animate-shimmer" />
      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gold/15" />
        <div className="skeleton-shimmer h-4 w-1/4 animate-shimmer" />
      </div>
    </div>
  )
}
