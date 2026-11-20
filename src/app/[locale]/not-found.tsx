import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('errors')
  const tCommon = await getTranslations('common')
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-24">
      <div className="max-w-md text-center">
        <p className="heading-display text-gilded mb-6 text-[9rem] italic leading-none">404</p>
        <h1 className="heading-display mb-4 text-4xl text-[var(--fg)]">{t('notFound')}</h1>
        <p className="mb-8 text-sm leading-relaxed text-[var(--fg-muted)]">
          {t('notFoundDescription')}
        </p>
        <Link
          href="/"
          className="btn-lux"
        >
          {tCommon('backToHome')}
        </Link>
      </div>
    </div>
  )
}
