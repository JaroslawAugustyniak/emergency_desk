export const i18nConfig = {
  defaultLocale: 'pl',
  locales: ['pl', 'en'],
  timeZone: 'Europe/Warsaw',
} as const;

export type Locale = (typeof i18nConfig.locales)[number];