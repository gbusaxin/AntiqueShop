import { SkeletonCard } from '@/components/ui/SkeletonCard'

export default function CatalogLoading() {
  return (
    <div className="min-h-screen bg-emerald-dark pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 py-10">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="mb-3 h-3 w-24 rounded bg-gold/15" />
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="mb-2 h-3 w-32 rounded bg-gold/10" />
                  ))}
                </div>
              ))}
            </div>
          </aside>
          <div className="flex-1">
            <div className="mb-6 flex animate-pulse items-center justify-between">
              <div className="h-4 w-32 rounded bg-gold/15" />
              <div className="h-8 w-40 rounded bg-gold/10" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
