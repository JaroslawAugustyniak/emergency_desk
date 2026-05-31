import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { i18nConfig } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || i18nConfig.defaultLocale) as typeof i18nConfig.locales[number];

  return {
    locale,
    timeZone: i18nConfig.timeZone,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
