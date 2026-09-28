import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-24">
      <div className="max-w-md text-center">
        <p className="mb-4 font-serif text-8xl text-[var(--accent)]">404</p>
        <h1 className="mb-4 font-serif text-2xl text-[var(--fg)]">Page Not Found</h1>
        <p className="mb-8 text-sm leading-relaxed text-[var(--fg-muted)]">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block border border-[var(--accent)] px-8 py-3 text-xs uppercase tracking-[0.18em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
