export default function LegalLoading() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-gold/10 pb-8">
          <div className="mb-3 h-2.5 w-12 animate-pulse rounded-full bg-gold/30" />
          <div className="mb-4 h-9 w-72 animate-pulse rounded bg-gold/20" />
          <div className="h-3 w-36 animate-pulse rounded bg-gold/10" />
        </div>

        <div className="space-y-10">
          {[...Array(6)].map((_, section) => (
            <div key={section} className="space-y-3">
              <div className="h-3 w-40 animate-pulse rounded bg-gold/25" />
              {[100, 95, 88, 100, 78].map((w, line) => (
                <div
                  key={line}
                  className="h-3.5 animate-pulse rounded bg-gold/10"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
