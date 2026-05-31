import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { i18nConfig } from './src/i18n/config';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  i18n: i18nConfig,
};

export default withNextIntl(nextConfig);
