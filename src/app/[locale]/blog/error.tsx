'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function BlogError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('blog')
  const locale = useLocale()
  return (
    <section role="alert" className="min-h-[60vh] bg-background px-4 pb-20 pt-40 text-center text-foreground">
      <p className="mb-5 text-xs uppercase tracking-[0.25em] text-[var(--fg-muted)]">{t('eyebrow')}</p>
      <h1 className="font-serif text-3xl sm:text-4xl">{t('errorTitle')}</h1>
      <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[var(--fg-muted)]">{t('errorDescription')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-5">
        <button onClick={reset} className="border border-primary/40 px-5 py-3 text-sm transition-colors hover:bg-primary/10 active:bg-primary/20">{t('retry')}</button>
        <Link href="/blog" locale={locale} className="px-2 py-3 text-sm underline underline-offset-4 hover:text-primary">{t('backToBlog')}</Link>
      </div>
    </section>
  )
}
