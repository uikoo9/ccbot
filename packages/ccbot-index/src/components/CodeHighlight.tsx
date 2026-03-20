'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeHighlightProps {
  code: string;
  language?: string;
}

export function CodeHighlight({ code, language = 'bash' }: CodeHighlightProps) {
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      customStyle={{
        margin: 0,
        padding: '24px',
        background: 'var(--color-background)',
        borderRadius: '8px',
        fontSize: '14px',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'var(--font-jetbrains)',
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
