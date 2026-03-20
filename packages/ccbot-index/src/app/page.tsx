import { PageContent } from '@/components/PageContent';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// Generate dynamic metadata based on locale
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t('heroTitle').replace('\n', ' '),
    description: t('heroSubtitle'),
  };
}

export default function Home() {
  return <PageContent />;
}
