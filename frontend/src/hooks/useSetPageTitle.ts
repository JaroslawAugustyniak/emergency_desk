import { useEffect } from 'react';
import { usePageTitle } from '@/app/components/context/PageTitleContext';
import { usePathname } from 'next/navigation';

export function useSetPageTitle(title: string, subtitle?: string) {
  const { setTitle, setSubtitle } = usePageTitle();
  const pathname = usePathname();

  useEffect(() => {
    setTitle(title);
    if (subtitle) {
      setSubtitle(subtitle);
    } else {
      setSubtitle('');
    }
  }, [title, subtitle, setTitle, setSubtitle, pathname]);
}