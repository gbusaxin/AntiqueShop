export default function AboutLoading() {
  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20">
      <div
        className="py-24"
        style={{ background: 'linear-gradient(135deg, #033728 0%, #3d0f0f 100%)' }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto mb-5 h-2.5 w-20 animate-pulse rounded-full bg-[#A67C52]/30" />
          <div className="mx-auto mb-4 h-10 w-80 animate-pulse rounded bg-[#A67C52]/20" />
          <div className="mx-auto h-4 w-64 animate-pulse rounded bg-[#A67C52]/10" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-[#A67C52]/10" />
          ))}
        </div>

        <div className="mb-16 space-y-4">
          {[100, 95, 88, 100, 80, 92].map((w, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-[#A67C52]/10"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="h-48 animate-pulse rounded bg-[#A67C52]/10" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#A67C52]/15" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[#A67C52]/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
