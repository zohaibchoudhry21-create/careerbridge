import { useEffect } from 'react';
import AppIcon from '../icons/AppIcon';

const aiFeatures = [
  {
    icon: 'find_in_page',
    title: 'ATS Optimization Engine',
    description: 'Simulates corporate screening software to ensure high parsability.',
    delay: '',
  },
  {
    icon: 'join_inner',
    title: 'Job Description Matching AI',
    description: 'Analyzes JD semantics to suggest missing skills you might possess.',
    delay: 'delay-100',
  },
  {
    icon: 'trending_up',
    title: 'Career Risk Analysis',
    description: 'AI-proof scoring to see how susceptible your target roles are to automation.',
    delay: 'delay-200',
  },
];

export default function AIPower() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let cancelled = false;

    import('particles.js')
      .then(() => {
        if (cancelled || typeof window.particlesJS === 'undefined') return;
        // particles.js deepExtend touches arguments.callee (throws in strict mode).
        // Guard so an uncaught error cannot interrupt React Router transitions.
        try {
          window.particlesJS('particles-js', {
            particles: {
              number: { value: 40, density: { enable: true, value_area: 800 } },
              color: { value: '#ffffff' },
              shape: { type: 'circle' },
              opacity: { value: 0.1, random: false },
              size: { value: 3, random: true },
              line_linked: {
                enable: true,
                distance: 150,
                color: '#ffffff',
                opacity: 0.1,
                width: 1,
              },
              move: {
                enable: true,
                speed: 1,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false,
              },
            },
            interactivity: {
              detect_on: 'canvas',
              events: {
                onhover: { enable: false },
                onclick: { enable: false },
                resize: true,
              },
            },
            retina_detect: true,
          });
        } catch {
          // Decorative only — safe to skip if the library fails.
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      const el = document.getElementById('particles-js');
      if (el) el.innerHTML = '';
    };
  }, []);

  return (
    <section className="bg-primary-container text-on-primary-container py-xl relative overflow-hidden">
      <div id="particles-js" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary to-transparent" />
      <div className="page-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg items-center">
          <div className="reveal-left is-visible">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-primary mb-4">
              Not just a resume builder — a complete career intelligence system.
            </h2>
            <p className="font-body-lg text-body-lg text-on-primary-container mb-8">
              Leverage deep learning to understand what hiring managers want before you even apply.
            </p>
            <div className="space-y-6">
              {aiFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className={`flex items-start gap-4 hover:translate-x-2 transition-transform duration-300 ${feature.delay}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-tint/30 flex items-center justify-center shrink-0">
                    <AppIcon name={feature.icon} size="h-5 w-5" className="text-on-primary" />
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-primary">{feature.title}</h4>
                    <p className="text-sm text-on-primary-container">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface/5 p-6 rounded-2xl border border-secondary/50 backdrop-blur-sm shadow-[0_0_30px_rgba(33,112,228,0.2)] reveal-zoom delay-300 is-visible">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface/10">
              <span className="font-label-md text-on-primary">Match Analysis</span>
              <span className="text-secondary-fixed text-sm font-bold animate-pulse">94% Match</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-primary-container">Keywords Detected</span>
                  <span className="text-on-primary">12/15</span>
                </div>
                <div className="w-full bg-surface/10 rounded-full h-1.5 overflow-hidden relative">
                  <div
                    className="bg-secondary-fixed h-1.5 rounded-full scanning-bar relative overflow-hidden"
                    style={{ width: '80%', transition: 'width 2s ease-in-out' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-primary-container">Formatting Score</span>
                  <span className="text-on-primary">100/100</span>
                </div>
                <div className="w-full bg-surface/10 rounded-full h-1.5 overflow-hidden relative">
                  <div
                    className="bg-emerald-400 h-1.5 rounded-full scanning-bar relative overflow-hidden"
                    style={{ width: '100%', transition: 'width 2s ease-in-out' }}
                  />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-surface/10">
                <p className="text-xs text-on-primary-container italic">
                  &quot;Strong alignment in technical skills. Suggest expanding on leadership experience
                  to reach 98%.&quot; - AI Assistant
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
