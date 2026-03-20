'use client';

import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Steps } from '@/components/Steps';
import { Footer } from '@/components/Footer';

export function PageContent() {
  return (
    <div className="page-container" suppressHydrationWarning>
      <Header />
      <Hero />
      <Steps />
      <Footer />
    </div>
  );
}
