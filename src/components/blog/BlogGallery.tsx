import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export async function BlogGallery({ images, title, locale }: { images: string[]; title: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'blog' })
  if (!images.length) return null

  return (
    <section aria-label={t('gallery')} className="mx-auto mt-12 max-w-5xl sm:mt-16">
      <div className="grid gap-6 sm:grid-cols-2">
        {images.map((image, index) => (
          <figure key={`${image}-${index}`} className={index === 0 ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
            <div className={`relative overflow-hidden bg-primary/5 ${index === 0 ? 'aspect-[4/3] sm:aspect-[16/9]' : 'aspect-[4/3]'}`}>
              <Image
                src={image}
                alt={t('imageAlt', { title, number: index + 1 })}
                fill
                priority={index === 0}
                sizes={index === 0 ? '(max-width: 1024px) 100vw, 1024px' : '(max-width: 640px) 100vw, 512px'}
                className="object-contain"
              />
            </div>
            <figcaption className="mt-3 text-xs tracking-wide text-[var(--fg-muted)]">{t('imageNumber', { number: index + 1, total: images.length })}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
