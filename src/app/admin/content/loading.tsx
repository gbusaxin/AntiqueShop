export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading site content">
      <div className="h-9 w-52 bg-[var(--border)]" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-9 w-28 bg-[var(--border)]" />)}
      </div>
      <div className="admin-card space-y-5 p-6">
        <div className="h-7 w-48 bg-[var(--border)]" />
        <div className="h-10 w-full bg-[var(--border)]" />
        <div className="h-44 w-full bg-[var(--border)]" />
      </div>
    </div>
  )
}
