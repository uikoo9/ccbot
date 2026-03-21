import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Providers } from './providers';
import { WebsiteSchema } from '@/components/WebsiteSchema';
import './styles.css';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  const title = locale === 'zh' ? 'ccbot.dev - Claude Code 机器人' : 'ccbot.dev - Claude Code Bot';
  const description =
    locale === 'zh'
      ? '在飞书、Slack、Discord、Telegram 等平台上使用 Claude Code，强大的聊天机器人界面。'
      : 'Use Claude Code on Feishu, Slack, Discord, Telegram and more. A powerful bot interface for Claude CLI.';

  return {
    metadataBase: new URL('https://ccbot.dev'),
    title: {
      template: '%s | ccbot.dev',
      default: title,
    },
    description,
    keywords: [
      'Claude Code',
      'Claude CLI',
      'Chat Bot',
      'AI Assistant',
      'Development Tools',
      'Feishu Bot',
      'Slack Bot',
      'Discord Bot',
      'Telegram Bot',
      'Claude',
      'Anthropic',
      '聊天机器人',
      '人工智能',
      '开发工具',
    ],
    authors: [{ name: 'ccbot.dev', url: 'https://ccbot.dev' }],
    creator: 'ccbot.dev',
    publisher: 'ccbot.dev',
    alternates: {
      canonical: '/',
      languages: {
        en: '/en',
        zh: '/zh',
        'en-US': '/en',
        'zh-CN': '/zh',
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    manifest: '/manifest.json',
    icons: {
      icon: [{ url: '/favicon.ico', sizes: 'any' }],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      alternateLocale: locale === 'zh' ? 'en_US' : 'zh_CN',
      url: 'https://ccbot.dev',
      siteName: 'ccbot.dev',
      title,
      description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@ccbotdev',
      creator: '@ccbotdev',
      title,
      description,
      images: ['/og-image.png'],
    },
    verification: {
      // Add your verification codes here when available
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
      // bing: 'your-bing-verification-code',
    },
    category: 'technology',
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#22C55E' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  colorScheme: 'dark light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning key={locale}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://static-small.vincentqiao.com" />

        {/* Font optimization */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* DNS Prefetch for better performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://static-small.vincentqiao.com" />
      </head>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(location.hostname.includes('ccbot.dev'))(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","vz55edb4ys");`,
          }}
        />
        <WebsiteSchema />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers key={locale}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
