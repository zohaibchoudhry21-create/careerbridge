import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IMAGES } from '../../config/images';

export default function LoginHero() {
  const { t } = useTranslation('auth');
  const heroContentRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth <= 1024 || !heroContentRef.current) return;

      const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
      const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
      heroContentRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="auth-hero-panel kinetic-gradient">
      <div className="absolute top-[-10%] right-[-10%] w-[min(500px,40vw)] h-[min(500px,40vw)] bg-secondary-container/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[min(400px,35vw)] h-[min(400px,35vw)] bg-primary-container/40 rounded-full blur-[80px]" />

      <div
        ref={heroContentRef}
        className="relative z-10 w-full max-w-xl xl:max-w-2xl 2xl:max-w-3xl transition-transform duration-200"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 glass-panel rounded-full mb-lg border border-white/20">
          <span className="font-label-sm text-label-sm text-surface-bright uppercase tracking-wider">
            {t('hero.badge')}
          </span>
        </div>

        <div className="glass-panel p-lg rounded-2xl space-y-md">
          <h2 className="font-display-lg-mobile text-display-lg-mobile xl:font-display-lg xl:text-display-lg text-surface-bright leading-tight">
            &ldquo;{t('hero.quote')}&rdquo;
          </h2>
          <p className="font-body-lg text-body-lg text-surface-bright/80">{t('hero.description')}</p>
        </div>

        <div className="mt-xl grid grid-cols-2 gap-md opacity-40">
          <div className="h-24 glass-panel rounded-2xl border-white/10 flex flex-col justify-end p-4">
            <div className="h-1/2 w-full bg-secondary-container/30 rounded-lg" />
          </div>
          <div className="h-24 glass-panel rounded-2xl border-white/10 flex flex-col justify-end p-4">
            <div className="h-4/5 w-full bg-secondary/30 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img
          className="w-full h-full object-cover mix-blend-overlay"
          alt={t('hero.imageAlt')}
          src={IMAGES.loginHero}
        />
      </div>
    </section>
  );
}
