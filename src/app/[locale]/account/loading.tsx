export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 h-8 w-40 animate-pulse rounded bg-[#A67C52]/20" />

        <div className="mb-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded border border-[#A67C52]/15 p-5 space-y-3">
            <div className="h-3 w-16 animate-pulse rounded bg-[#A67C52]/20" />
            <div className="h-7 w-24 animate-pulse rounded bg-[#A67C52]/30" />
          </div>
          <div className="rounded border border-[#A67C52]/15 p-5 space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-[#A67C52]/20" />
            <div className="h-7 w-16 animate-pulse rounded bg-[#A67C52]/30" />
          </div>
          <div className="rounded border border-[#A67C52]/15 p-5 space-y-3">
            <div className="h-3 w-14 animate-pulse rounded bg-[#A67C52]/20" />
            <div className="h-7 w-28 animate-pulse rounded bg-[#A67C52]/30" />
          </div>
        </div>

        <div className="mb-4 h-5 w-28 animate-pulse rounded bg-[#A67C52]/20" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border border-[#A67C52]/10 p-4">
              <div className="h-14 w-14 animate-pulse rounded bg-[#A67C52]/15" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-48 animate-pulse rounded bg-[#A67C52]/20" />
                <div className="h-3 w-32 animate-pulse rounded bg-[#A67C52]/10" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded bg-[#A67C52]/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
