import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { localizedBlog, type BlogPost } from './types'
import { blogDate, blogListHref } from './metadata'

export async function BlogCard({ post, locale }: { post: BlogPost; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'blog' })
  const title = localizedBlog(post, locale, 'title')
  const date = post.published_at ?? post.created_at
  const href = `/blog/${encodeURIComponent(post.slug)}`

  return (
    <article className="group flex min-w-0 flex-col border-b border-primary/20 pb-8">
      {post.images[0] && (
        <Link href={href} locale={locale} tabIndex={-1} aria-hidden="true" className="relative mb-6 block aspect-[4/3] overflow-hidden bg-primary/5">
          <Image
            src={post.images[0]}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        </Link>
      )}
      <time dateTime={date} className="mb-3 text-xs tracking-wide text-[var(--fg-muted)]">{blogDate(date, locale)}</time>
      <h2 className="break-words font-serif text-2xl leading-snug sm:text-3xl">
        <Link href={href} locale={locale} className="transition-colors hover:text-primary">{title}</Link>
      </h2>
      <p className="mt-4 line-clamp-3 break-words text-sm leading-7 text-[var(--fg-muted)]">{localizedBlog(post, locale, 'excerpt')}</p>
      {post.tags.length > 0 && (
        <ul aria-label={t('tags')} className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--fg-muted)]">
          {post.tags.map((tag, index) => (
            <li key={`${tag}-${index}`} className="max-w-full break-words">
              <Link href={blogListHref(1, tag)} locale={locale} className="underline decoration-primary/40 underline-offset-4 hover:text-foreground">{tag}</Link>
            </li>
          ))}
        </ul>
      )}
      <Link href={href} locale={locale} aria-label={t('readArticleLabel', { title })} className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-sm font-medium text-foreground underline decoration-primary/50 underline-offset-8 transition-colors hover:text-primary">
        {t('readArticle')} <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </article>
  )
}
