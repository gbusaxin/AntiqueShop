import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { BlogCard } from '@/components/blog/BlogCard'
import { blogAlternates, blogListHref, blogUrl } from '@/components/blog/metadata'
import { getBlogListing, parseBlogFilters, type BlogSearchParams } from '@/components/blog/queries'

interface BlogPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<BlogSearchParams>
}

export async function generateMetadata({ params, searchParams }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params
  const { page: requestedPage, tag } = parseBlogFilters(await searchParams)
  const { page } = await getBlogListing(requestedPage, tag)
  const t = await getTranslations({ locale, namespace: 'blog' })
  const href = blogListHref(page, tag)
  const query = href.slice('/blog'.length)
  const url = blogUrl(locale)
  return {
    title: `${t('title')} — Belle Époque`,
    description: t('description'),
    alternates: blogAlternates(locale, '/blog', query),
    openGraph: {
      type: 'website',
      title: t('title'),
      description: t('description'),
      siteName: 'Belle Époque',
      ...(url ? { url: url + query } : {}),
    },
  }
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params
  const { page: requestedPage, tag } = parseBlogFilters(await searchParams)
  const { posts, count, page, totalPages } = await getBlogListing(requestedPage, tag)
  const t = await getTranslations({ locale, namespace: 'blog' })

  return (
    <div className="min-h-screen bg-background pt-24 text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <header className="max-w-3xl pb-12 sm:pb-16">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-[var(--fg-muted)]">{t('eyebrow')}</p>
          <h1 className="font-serif text-4xl leading-tight sm:text-6xl">{t('title')}</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[var(--fg-muted)]">{t('description')}</p>
        </header>

        <div className="mb-10 flex flex-col gap-6 border-y border-primary/20 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--fg-muted)]">{t('postCount', { count })}</p>
          <form action={`/${locale}/blog`} method="get" className="flex flex-wrap items-center gap-3">
            <label htmlFor="blog-tag" className="text-sm">{t('filterTag')}</label>
            <input id="blog-tag" name="tag" type="text" defaultValue={tag} maxLength={100} placeholder={t('tagPlaceholder')} className="min-w-0 flex-1 border border-primary/30 bg-background px-3 py-2 text-sm placeholder:text-[var(--fg-muted)] sm:w-44 sm:flex-none" />
            <button type="submit" className="border border-primary/30 px-4 py-2 text-sm transition-colors hover:bg-primary/10 active:bg-primary/20">{t('applyFilter')}</button>
            {tag && <Link href="/blog" locale={locale} className="text-sm underline underline-offset-4 hover:text-primary">{t('clearFilter')}</Link>}
          </form>
        </div>

        {tag && <p className="mb-8 break-words text-sm text-[var(--fg-muted)]">{t('filteredBy', { tag })}</p>}
        {posts.length ? (
          <section aria-label={t('articles')} className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
            {posts.map((post) => <BlogCard key={post.id} post={post} locale={locale} />)}
          </section>
        ) : (
          <section className="border-b border-primary/20 py-16 text-center">
            <h2 className="font-serif text-2xl sm:text-3xl">{t(tag ? 'emptyFilteredTitle' : 'emptyTitle')}</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--fg-muted)]">{t(tag ? 'emptyFilteredDescription' : 'emptyDescription')}</p>
            {tag && <Link href="/blog" locale={locale} className="mt-6 inline-block underline underline-offset-4 hover:text-primary">{t('allArticles')}</Link>}
          </section>
        )}

        {totalPages > 1 && (
          <nav aria-label={t('pagination')} className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-primary/20 pt-8 text-sm">
            {page > 1 ? <Link href={blogListHref(page - 1, tag)} locale={locale} rel="prev" className="px-2 py-2 underline underline-offset-4 hover:text-primary">{t('previous')}</Link> : <span aria-disabled="true" className="px-2 py-2 text-[var(--fg-muted)]">{t('previous')}</span>}
            <span aria-current="page" className="text-[var(--fg-muted)]">{t('pageOf', { page, total: totalPages })}</span>
            {page < totalPages ? <Link href={blogListHref(page + 1, tag)} locale={locale} rel="next" className="px-2 py-2 underline underline-offset-4 hover:text-primary">{t('next')}</Link> : <span aria-disabled="true" className="px-2 py-2 text-[var(--fg-muted)]">{t('next')}</span>}
          </nav>
        )}
      </div>
    </div>
  )
}
