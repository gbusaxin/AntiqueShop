export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-emerald-dark pt-24">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex animate-pulse gap-3">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gold/15" />
              <div className="h-3 w-20 rounded bg-gold/10" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3 animate-pulse space-y-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="mb-2 h-2 w-24 rounded bg-gold/15" />
                <div className="h-11 w-full rounded bg-gold/10" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 animate-pulse space-y-4 border border-gold/15 p-6">
            <div className="h-5 w-32 rounded bg-gold/15" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-14 w-14 rounded bg-gold/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-gold/10" />
                  <div className="h-4 w-20 rounded bg-gold/10" />
                </div>
              </div>
            ))}
            <div className="h-px bg-gold/15" />
            <div className="h-4 w-full rounded bg-gold/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
