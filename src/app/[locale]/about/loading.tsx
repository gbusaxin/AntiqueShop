export default function AboutLoading() {
  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20 animate-pulse">
      <div className="py-24" style={{ background: 'linear-gradient(135deg, #033728 0%, #3d0f0f 100%)' }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto mb-4 h-3 w-24 rounded bg-gold/20" />
          <div className="mx-auto mb-6 h-10 w-96 rounded bg-gold/20" />
          <div className="mx-auto h-4 w-80 rounded bg-gold/10" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="grid gap-8 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded bg-gold/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
