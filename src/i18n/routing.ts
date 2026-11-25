import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ru', 'en', 'de'],
  defaultLocale: 'en',
  // hreflang lives in each page's <head> with the canonical domain; the middleware's Link header
  // would advertise whatever host served the request (e.g. the Railway domain)
  alternateLinks: false
});
