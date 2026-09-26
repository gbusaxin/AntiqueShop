export default function CartLoading() {
  return (
    <div className="min-h-screen bg-emerald-dark pt-24">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 h-8 w-32 animate-pulse rounded bg-gold/15" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex animate-pulse gap-5 border border-gold/15 p-4">
                <div className="h-24 w-24 shrink-0 rounded bg-gold/10" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-48 rounded bg-gold/15" />
                  <div className="h-5 w-32 rounded bg-gold/10" />
                  <div className="h-4 w-24 rounded bg-gold/10" />
                </div>
              </div>
            ))}
          </div>
          <div className="animate-pulse space-y-4 border border-gold/15 p-6">
            <div className="h-5 w-32 rounded bg-gold/15" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 rounded bg-gold/10" />
                <div className="h-4 w-16 rounded bg-gold/10" />
              </div>
            ))}
            <div className="h-12 w-full rounded bg-gold/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
