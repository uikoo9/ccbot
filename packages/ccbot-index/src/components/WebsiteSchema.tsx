export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://ccbot.dev/#website',
        url: 'https://ccbot.dev',
        name: 'ccbot.dev',
        description:
          'Use Claude Code on Feishu, Slack, Discord, Telegram and more. A powerful bot interface for Claude CLI.',
        publisher: {
          '@id': 'https://ccbot.dev/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://ccbot.dev/?s={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: ['en-US', 'zh-CN'],
      },
      {
        '@type': 'Organization',
        '@id': 'https://ccbot.dev/#organization',
        name: 'ccbot.dev',
        url: 'https://ccbot.dev',
        logo: {
          '@type': 'ImageObject',
          url: 'https://ccbot.dev/logo.svg',
          width: 512,
          height: 512,
        },
        sameAs: ['https://github.com/uikoo9/ccbot'],
      },
      {
        '@type': 'WebPage',
        '@id': 'https://ccbot.dev/#webpage',
        url: 'https://ccbot.dev',
        name: 'ccbot.dev - Claude Code Bot for Feishu/Slack/Discord/Telegram',
        isPartOf: {
          '@id': 'https://ccbot.dev/#website',
        },
        about: {
          '@id': 'https://ccbot.dev/#organization',
        },
        description:
          'Use Claude Code on Feishu, Slack, Discord, Telegram and more. A powerful bot interface for Claude CLI.',
        inLanguage: ['en-US', 'zh-CN'],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'ccbot',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5',
          ratingCount: '1',
        },
        description:
          'A bot interface for Claude Code CLI that lets you use Claude directly in Feishu, Slack, Discord and Telegram.',
        url: 'https://ccbot.dev',
        screenshot: 'https://static-small.vincentqiao.com/ccbot.png',
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
