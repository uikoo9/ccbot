'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

// 动态导入代码高亮组件，减少初始bundle
const CodeHighlight = dynamic(() => import('./CodeHighlight').then((mod) => ({ default: mod.CodeHighlight })), {
  ssr: false,
  loading: () => (
    <div
      style={{
        padding: '24px',
        background: 'var(--color-background)',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'var(--font-jetbrains)',
      }}
    >
      Loading...
    </div>
  ),
});

interface StepProps {
  titleKey: string;
  descriptionKey: string;
  codeKey?: string;
  codeLanguage?: string;
}

function Step({ titleKey, descriptionKey, codeKey, codeLanguage = 'bash' }: StepProps) {
  const t = useTranslations();

  const renderDescription = () => {
    if (descriptionKey === 'step1Description') {
      const description = t(descriptionKey);
      const feishuPattern = /(open\.feishu\.cn)/;
      const parts = description.split(feishuPattern);

      return (
        <p className="step-description">
          {parts.map((part, index) => {
            if (part.match(feishuPattern)) {
              return (
                <a
                  key={index}
                  href="https://open.feishu.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="step-link"
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
        </p>
      );
    }

    return <p className="step-description">{t(descriptionKey)}</p>;
  };

  return (
    <div className="step-card">
      {/* Title */}
      <h3 className="step-title">{t(titleKey)}</h3>

      {/* Description */}
      {renderDescription()}

      {/* Code Block */}
      {codeKey ? (
        <div className="step-code-block">
          <CodeHighlight code={t(codeKey)} language={codeLanguage} />
        </div>
      ) : null}
    </div>
  );
}

export function Steps() {
  const t = useTranslations();

  return (
    <div className="steps" id="steps">
      <div className="container">
        {/* Section Title */}
        <h2 className="steps-title">{t('getStarted')}</h2>

        {/* Steps */}
        <div>
          <Step titleKey="step1Title" descriptionKey="step1Description" codeKey="step1Code" codeLanguage="json" />

          <Step titleKey="step2Title" descriptionKey="step2Description" codeKey="step2Code" />

          <Step titleKey="step3Title" descriptionKey="step3Description" />
        </div>
      </div>
    </div>
  );
}
