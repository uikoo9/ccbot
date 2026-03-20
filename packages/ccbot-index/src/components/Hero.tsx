'use client';

import { useTranslations } from 'next-intl';
import { TypeAnimation } from 'react-type-animation';
import { useEffect, useRef } from 'react';

export function Hero() {
  const t = useTranslations();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // English characters - numbers, letters, symbols
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%^&*()_+-=[]{}|;:,.<>?';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    // Start with random positions to avoid line-by-line initial effect
    const drops: number[] = Array(Math.floor(columns))
      .fill(0)
      .map(() => Math.floor((Math.random() * canvas.height) / fontSize));

    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Green text
      ctx.fillStyle = '#00CC66';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop randomly or when it reaches bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="hero">
      {/* Matrix code rain background */}
      <canvas ref={canvasRef} className="hero-matrix-bg" />

      {/* Title with typing animation */}
      <div className="hero-title-line">
        <span>Claude Code </span>
        <TypeAnimation
          sequence={[
            'in CLI?',
            2000,
            '',
            0,
            'on Feishu?',
            2000,
            '',
            0,
            'on Slack?',
            2000,
            '',
            0,
            'on Discord?',
            2000,
            '',
            0,
            'on Telegram?',
            2000,
            '',
            0,
            'Everywhere!',
            3000,
          ]}
          wrapper="span"
          speed={50}
          style={{ color: 'var(--color-accent)' }}
          repeat={Infinity}
          preRenderFirstString={true}
          cursor={true}
        />
      </div>

      {/* CTA Button */}
      <div className="hero-cta">
        <a href="#steps">
          <button className="btn btn-primary btn-lg">{t('ctaButton')}</button>
        </a>
      </div>
    </div>
  );
}
