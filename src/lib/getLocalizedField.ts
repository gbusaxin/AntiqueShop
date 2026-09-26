type Locale = 'ru' | 'en' | 'de'

type LocalizedObject = Record<string, string | null | undefined>

export function getLocalizedField(
  obj: LocalizedObject,
  field: string,
  locale: Locale
): string {
  const priority: Locale[] = [locale, 'en', 'ru', 'de']

  for (const currentLocale of priority) {
    const value = obj[`${field}_${currentLocale}`]
    if (value && value.trim() !== '') return value
  }

  for (const currentLocale of ['ru', 'en', 'de'] as Locale[]) {
    const value = obj[`${field}_${currentLocale}`]
    if (value && value.trim() !== '') return value
  }

  return ''
}

export function getLocalizationCompleteness(
  obj: LocalizedObject,
  field: string
): number {
  const locales: Locale[] = ['ru', 'en', 'de']

  return locales.filter((locale) => {
    const value = obj[`${field}_${locale}`]
    return value && value.trim() !== ''
  }).length
}
