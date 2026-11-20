/** Soft fade-in on every storefront navigation (pure CSS, no hydration dependency). */
export default function LocaleTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>
}
