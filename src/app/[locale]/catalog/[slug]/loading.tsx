export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-emerald-dark pt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 h-3 w-48 animate-pulse rounded bg-gold/15" />
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-square animate-pulse rounded bg-gold/10" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded bg-gold/10" />
              ))}
            </div>
          </div>
          <div className="space-y-6 animate-pulse">
            <div className="h-3 w-24 rounded bg-gold/15" />
            <div className="h-10 w-3/4 rounded bg-gold/10" />
            <div className="h-6 w-32 rounded bg-gold/10" />
            <div className="h-4 w-40 rounded bg-gold/10" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-gold/10" />
              ))}
            </div>
            <div className="h-12 w-full rounded bg-gold/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
