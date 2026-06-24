import { useEffect } from 'react';

export function useNavbarScroll(navRef) {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const handleScroll = () => {
      if (window.scrollY > 10) {
        nav.classList.add('shadow-md');
        nav.classList.remove('shadow-sm');
      } else {
        nav.classList.remove('shadow-md');
        nav.classList.add('shadow-sm');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navRef]);
}

export function useRevealAnimation(containerRef) {
  useEffect(() => {
    const container = containerRef?.current || document;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealElements = container.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-zoom, .reveal-container'
    );

    if (reducedMotion) {
      revealElements.forEach((el) => el.classList.add('is-visible'));
      const drawLine = container.querySelector('.anim-draw-line');
      if (drawLine) drawLine.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (entry.target.id === 'how-it-works-container') {
              const line = entry.target.querySelector('.anim-draw-line');
              if (line) line.classList.add('is-visible');
            }
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.15 }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [containerRef]);
}
