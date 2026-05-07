import { PageContent } from '@/components/PageContent';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: `ccbot.dev - ${t('tagline')}`,
    description: t('heroSubtitle'),
  };
}

export default function Home() {
  return <PageContent />;
}
