export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 animate-pulse">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 h-8 w-48 rounded bg-gold/20" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-40 rounded bg-gold/5" />
          <div className="h-40 rounded bg-gold/5 md:col-span-2" />
        </div>
        <div className="mt-8 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded bg-gold/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
