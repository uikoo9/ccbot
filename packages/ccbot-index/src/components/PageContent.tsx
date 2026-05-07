'use client';

import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Platforms } from '@/components/Platforms';
import { Features } from '@/components/Features';
import { Footer } from '@/components/Footer';

export function PageContent() {
  return (
    <div className="page-container" suppressHydrationWarning>
      <Header />
      <Hero />
      <Platforms />
      <Features />
      <Footer />
    </div>
  );
}
