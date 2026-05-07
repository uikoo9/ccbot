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

    const style = getComputedStyle(document.documentElement);
    const matrixColor = style.getPropertyValue('--matrix-rain-color').trim() || '#00cc66';
    const fadeBg = style.getPropertyValue('--matrix-fade-bg').trim() || 'rgba(0,0,0,0.05)';

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%^&*()_+-=[]{}|;:,.<>?';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns))
      .fill(0)
      .map(() => Math.floor((Math.random() * canvas.height) / fontSize));

    const draw = () => {
      ctx.fillStyle = fadeBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = matrixColor;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

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
      <canvas ref={canvasRef} className="hero-matrix-bg" />

      <div className="hero-content">
        <span className="hero-eyebrow">{t('heroEyebrow')}</span>

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
            className="typed-text"
            repeat={Infinity}
            preRenderFirstString={true}
            cursor={true}
          />
        </div>

        <p className="hero-subtitle">{t('heroSubtitle')}</p>

        <div className="hero-cta">
          <a href="#features">
            <button className="btn btn-primary btn-lg">{t('heroCta')}</button>
          </a>
          <a href="https://github.com/uikoo9/ccbot" target="_blank" rel="noopener noreferrer">
            <button className="btn btn-secondary btn-lg">{t('heroCtaGithub')}</button>
          </a>
        </div>
      </div>
    </div>
  );
}
