export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1f18] animate-pulse">
      <div className="w-full max-w-sm space-y-4 px-4">
        <div className="mx-auto mb-8 h-8 w-40 rounded bg-gold/20" />
        <div className="h-12 rounded bg-gold/10" />
        <div className="h-12 rounded bg-gold/10" />
        <div className="h-12 rounded bg-gold/15" />
      </div>
    </div>
  )
}
