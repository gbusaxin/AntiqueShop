export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-7 w-36 animate-pulse rounded bg-gold/25" />
          <div className="h-2.5 w-20 animate-pulse rounded-full bg-gold/15" />
        </div>

        <div className="flex flex-col gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-2.5 w-14 animate-pulse rounded bg-gold/20" />
              <div className="h-11 animate-pulse rounded border border-gold/20 bg-gold/5" />
            </div>
          ))}

          <div className="mt-2 h-12 animate-pulse rounded border border-gold/30 bg-gold/10" />

          <div className="flex justify-between">
            <div className="h-2.5 w-28 animate-pulse rounded bg-gold/15" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-gold/15" />
          </div>
        </div>
      </div>
    </div>
  )
}
