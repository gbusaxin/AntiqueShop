export default function RegisterLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1f18] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-7 w-36 animate-pulse rounded bg-[#A67C52]/25" />
          <div className="h-2.5 w-28 animate-pulse rounded-full bg-[#A67C52]/15" />
        </div>

        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-2.5 w-16 animate-pulse rounded bg-[#A67C52]/20" />
              <div className="h-11 animate-pulse rounded border border-[#A67C52]/20 bg-[#A67C52]/5" />
            </div>
          ))}

          <div className="mt-2 h-12 animate-pulse rounded border border-[#A67C52]/30 bg-[#A67C52]/10" />

          <div className="flex justify-center">
            <div className="h-2.5 w-44 animate-pulse rounded bg-[#A67C52]/15" />
          </div>
        </div>
      </div>
    </div>
  )
}
