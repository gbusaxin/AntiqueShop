import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

const timeZones = {
  ru: 'Europe/Moscow',
  en: 'Europe/London',
  de: 'Europe/Berlin'
} as const;

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as keyof typeof timeZones)
    : routing.defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
    timeZone: timeZones[resolvedLocale]
  };
});
