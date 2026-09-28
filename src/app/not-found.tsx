import Link from 'next/link'

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#14110F] text-[#EDEDED] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="mb-4 font-serif text-8xl text-[#A67C52]">404</p>
          <h1 className="mb-4 font-serif text-2xl">Page Not Found</h1>
          <p className="mb-8 text-sm leading-relaxed text-[#B5B5B5]">
            The page you are looking for does not exist.
          </p>
          <Link
            href="/en"
            className="inline-block border border-[#A67C52] px-8 py-3 text-xs uppercase tracking-[0.18em] text-[#A67C52] transition-colors hover:bg-[#A67C52] hover:text-[#14110F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A67C52]"
          >
            Go to Homepage
          </Link>
        </div>
      </body>
    </html>
  )
}
