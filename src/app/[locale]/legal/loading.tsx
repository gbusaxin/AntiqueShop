export default function LegalLoading() {
  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 animate-pulse">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="mb-6 h-8 w-64 rounded bg-gold/20" />
        <div className="space-y-3">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-gold/10"
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
