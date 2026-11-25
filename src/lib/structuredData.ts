// schema.org JSON-LD builders. Only real data goes in: Google treats invented details as spam.
import { absoluteUrl, localizedUrl, SITE_NAME } from '@/lib/seo'

export const ORGANIZATION_ID = '#organization'
export const WEBSITE_ID = '#website'

// Public profiles of the shop; add Instagram etc. here once they exist
const SAME_AS = ['https://www.etsy.com/shop/VintagEmpireSK']

export interface ContactDetails {
  email?: unknown
  phone?: unknown
  address?: unknown
}

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)

/** The shop as an organisation; contact details come from the Contacts page edited in the admin */
export function organizationJsonLd(description: string, contacts: ContactDetails = {}) {
  const email = text(contacts.email)
  const telephone = text(contacts.phone)
  const address = text(contacts.address)
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': absoluteUrl(`/${ORGANIZATION_ID}`),
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: { '@type': 'ImageObject', url: absoluteUrl('/brand-icon.png'), width: 512, height: 512 },
    image: absoluteUrl('/brand-icon.png'),
    description,
    sameAs: SAME_AS,
    ...(email ? { email } : {}),
    ...(telephone ? { telephone } : {}),
    ...(address ? { address } : {}),
    ...(email || telephone
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            ...(email ? { email } : {}),
            ...(telephone ? { telephone } : {}),
            availableLanguage: ['English', 'German', 'Russian'],
          },
        }
      : {}),
  }
}

export function websiteJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl(`/${WEBSITE_ID}`),
    name: SITE_NAME,
    url: localizedUrl(locale),
    inLanguage: locale,
    publisher: { '@id': absoluteUrl(`/${ORGANIZATION_ID}`) },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${localizedUrl(locale, '/catalog')}?search={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** Breadcrumb trail; `path` is without the locale prefix, the last item may omit it */
export function breadcrumbJsonLd(locale: string, items: { name: string; path?: string; query?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path !== undefined ? { item: localizedUrl(locale, item.path, item.query ?? '') } : {}),
    })),
  }
}

export interface ProductJsonLdInput {
  locale: string
  slug: string
  name: string
  description: string
  images: string[]
  sku: string | null
  priceEur: number
  available: boolean
  category?: string | null
  material?: string | null
  countryOfOrigin?: string | null
  year?: string | number | null
}

/** Product + Offer. Antiques are always pre-owned (UsedCondition); prices are quoted in EUR, as in the feed. */
export function productJsonLd(p: ProductJsonLdInput) {
  const url = localizedUrl(p.locale, `/catalog/${p.slug}`)
  // A sold piece keeps its page; an offer valid until the end of next year avoids "priceValidUntil" warnings
  const validUntil = `${new Date().getUTCFullYear() + 1}-12-31`
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: p.name,
    description: p.description,
    image: p.images.slice(0, 10),
    url,
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.category ? { category: p.category } : {}),
    ...(p.material ? { material: p.material } : {}),
    ...(p.countryOfOrigin ? { countryOfOrigin: p.countryOfOrigin } : {}),
    ...(p.year ? { productionDate: String(p.year) } : {}),
    itemCondition: 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: p.priceEur.toFixed(2),
      priceValidUntil: validUntil,
      itemCondition: 'https://schema.org/UsedCondition',
      availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      seller: { '@id': absoluteUrl(`/${ORGANIZATION_ID}`) },
    },
  }
}

/** A list of products on a catalog page (helps search engines see the listing structure) */
export function itemListJsonLd(locale: string, products: { slug: string; name: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: localizedUrl(locale, `/catalog/${p.slug}`),
      name: p.name,
    })),
  }
}
