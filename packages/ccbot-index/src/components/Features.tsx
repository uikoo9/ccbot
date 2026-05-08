'use client';

import { useTranslations } from 'next-intl';

const GlobeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const TerminalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const KeyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

interface FeatureData {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  tags: string[];
}

const features: FeatureData[] = [
  {
    icon: <GlobeIcon />,
    titleKey: 'feature1Title',
    descKey: 'feature1Desc',
    tags: ['feishu', 'slack', 'discord', 'telegram'],
  },
  {
    icon: <ShieldIcon />,
    titleKey: 'feature2Title',
    descKey: 'feature2Desc',
    tags: ['queue', 'pm2', 'timeout'],
  },
  {
    icon: <TerminalIcon />,
    titleKey: 'feature3Title',
    descKey: 'feature3Desc',
    tags: ['/new', '/stop', '/model', '/cost'],
  },
  {
    icon: <KeyIcon />,
    titleKey: 'feature4Title',
    descKey: 'feature4Desc',
    tags: ['oauth', 'api-key', 'interactive'],
  },
];

export function Features() {
  const t = useTranslations();

  return (
    <section className="features" id="features">
      <div className="container">
        <h2 className="section-title">{t('featuresTitle')}</h2>
        <p className="section-subtitle">{t('featuresSubtitle')}</p>
        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.titleKey} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{t(feature.titleKey)}</h3>
              <p className="feature-desc">{t(feature.descKey)}</p>
              <div className="feature-tags">
                {feature.tags.map((tag) => (
                  <span key={tag} className="feature-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
