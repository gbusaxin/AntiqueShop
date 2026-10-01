export default function ContactsLoading() {
  return (
    <div className="min-h-screen bg-[#0a1f18] pt-20">
      <div
        className="py-24"
        style={{ background: 'linear-gradient(135deg, #033728 0%, #3d0f0f 100%)' }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto mb-5 h-2.5 w-20 animate-pulse rounded-full bg-[#A67C52]/30" />
          <div className="mx-auto mb-4 h-10 w-72 animate-pulse rounded bg-[#A67C52]/20" />
          <div className="mx-auto h-4 w-56 animate-pulse rounded bg-[#A67C52]/10" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1 h-5 w-5 flex-shrink-0 animate-pulse rounded-full bg-[#A67C52]/30" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-[#A67C52]/20" />
                  <div className="h-3 w-full animate-pulse rounded bg-[#A67C52]/10" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-[#A67C52]/10" />
                </div>
              </div>
            ))}

            <div className="border border-[#A67C52]/15 p-6 space-y-4 mt-8">
              <div className="h-4 w-28 animate-pulse rounded bg-[#A67C52]/20" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded bg-[#A67C52]/10" />
              ))}
              <div className="h-24 animate-pulse rounded bg-[#A67C52]/10" />
              <div className="h-11 animate-pulse rounded bg-[#A67C52]/20" />
            </div>
          </div>

          <div className="h-[480px] animate-pulse rounded bg-[#A67C52]/10 lg:h-auto" />
        </div>
      </div>
    </div>
  )
}
