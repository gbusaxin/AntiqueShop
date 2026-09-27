import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

const timeZones = {
  ru: 'Europe/Moscow',
  en: 'Europe/London',
  de: 'Europe/Berlin'
} as const;

type SupportedLocale = keyof typeof timeZones;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: SupportedLocale =
    requested && (routing.locales as readonly string[]).includes(requested)
      ? (requested as SupportedLocale)
      : routing.defaultLocale as SupportedLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: timeZones[locale]
  };
});
