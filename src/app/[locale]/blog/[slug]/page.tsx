import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ContentText } from '@/components/admin/MarkdownEditor'
import { JsonLd } from '@/components/JsonLd'
import { BlogGallery } from '@/components/blog/BlogGallery'
import { getBlogPost } from '@/components/blog/queries'
import { localizedBlog } from '@/components/blog/types'
import { blogAlternates, blogDate, blogListHref, blogUrl } from '@/components/blog/metadata'

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()
  const t = await getTranslations({ locale, namespace: 'blog' })
  const title = localizedBlog(post, locale, 'title')
  const description = localizedBlog(post, locale, 'excerpt')
  const path = `/blog/${encodeURIComponent(post.slug)}`
  const url = blogUrl(locale, path)

  return {
    title: `${title} — Belle Époque`,
    description,
    alternates: blogAlternates(locale, path),
    openGraph: {
      type: 'article',
      title,
      description,
      siteName: 'Belle Époque',
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      tags: post.tags,
      ...(url ? { url } : {}),
      ...(post.images[0] ? { images: [{ url: post.images[0], alt: t('imageAlt', { title, number: 1 }) }] } : {}),
    },
  }
}

export default async function BlogArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()
  const t = await getTranslations({ locale, namespace: 'blog' })
  const title = localizedBlog(post, locale, 'title')
  const excerpt = localizedBlog(post, locale, 'excerpt')
  const date = post.published_at ?? post.created_at
  const url = blogUrl(locale, `/blog/${encodeURIComponent(post.slug)}`)
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt,
    datePublished: date,
    dateModified: post.updated_at,
    inLanguage: locale,
    keywords: post.tags.join(', '),
    publisher: { '@type': 'Organization', name: 'Belle Époque' },
    ...(post.images.length ? { image: post.images } : {}),
    ...(url ? { url, mainEntityOfPage: { '@type': 'WebPage', '@id': url } } : {}),
  }

  return (
    <div className="min-h-screen bg-background pt-24 text-foreground">
      <JsonLd data={jsonLd} />
      <article className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" locale={locale} className="mb-10 inline-flex items-center gap-2 text-sm underline decoration-primary/40 underline-offset-4 hover:text-primary">
            <ArrowLeft size={16} aria-hidden="true" /> {t('backToBlog')}
          </Link>
          <header>
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-[var(--fg-muted)]">{t('eyebrow')}</p>
            <h1 className="break-words font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
            <time dateTime={date} className="mt-6 block text-sm text-[var(--fg-muted)]">{blogDate(date, locale)}</time>
            {excerpt && <p className="mt-8 break-words font-serif text-xl leading-relaxed text-[var(--fg-muted)] sm:text-2xl">{excerpt}</p>}
            {post.tags.length > 0 && (
              <ul aria-label={t('tags')} className="mt-6 flex flex-wrap gap-3">
                {post.tags.map((tag, index) => (
                  <li key={`${tag}-${index}`} className="max-w-full">
                    <Link href={blogListHref(1, tag)} locale={locale} className="inline-block break-words border border-primary/25 px-3 py-1.5 text-xs transition-colors hover:bg-primary/10">{tag}</Link>
                  </li>
                ))}
              </ul>
            )}
          </header>
        </div>
        <BlogGallery images={post.images} title={title} locale={locale} />
        <div className="mx-auto mt-12 max-w-3xl border-t border-primary/20 pt-10 sm:mt-16 sm:pt-12 [&>div]:text-base [&>div]:leading-8 [&_blockquote]:font-serif [&_blockquote]:text-xl [&_h1]:text-3xl [&_h2]:text-3xl [&_h3]:text-2xl [&_h4]:text-xl [&_h5]:text-lg [&_h6]:text-base [&_pre]:text-sm">
          <ContentText content={localizedBlog(post, locale, 'content')} />
        </div>
        <footer className="mx-auto mt-16 max-w-3xl border-t border-primary/20 pt-8">
          <Link href="/blog" locale={locale} className="inline-flex items-center gap-2 text-sm underline underline-offset-4 hover:text-primary">
            <ArrowLeft size={16} aria-hidden="true" /> {t('allArticles')}
          </Link>
        </footer>
      </article>
    </div>
  )
}
