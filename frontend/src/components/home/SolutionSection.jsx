import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, ArrowUpRight, ScanLine } from 'lucide-react';
import { IMAGES } from '../../config/images';

/** Hardcoded ink/card accents from the Career OS redesign (not page background). */
const TOKENS = {
  ink: '#14213D',
  inkSoft: '#5B6280',
  line: '#E6E1D3',
  signal: '#0E9F6E',
  highlight: '#F5B93D',
  card: '#FFFFFF',
  paper: '#FAF8F3',
};

/** Project surface so the ATS badge cutout matches the section background. */
const SECTION_BG = '#eff4ff'; // surface-container-low

/** Keep in sync with `.career-os-scan-line` animation duration. */
const SCAN_MS = 2600;
const SCORE_ANIM_MS = 700;
const TARGET_ATS_SCORE = 94;

export default function SolutionSection() {
  const { t } = useTranslation('marketing');
  const steps = t('solution.points', { returnObjects: true });
  const sectionRef = useRef(null);

  const [reveal, setReveal] = useState(0);
  const [score, setScore] = useState(0);
  const [scanDone, setScanDone] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Left checklist loop (independent)
  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) {
      setReveal(3);
      return undefined;
    }

    const phases = [0, 1, 2, 3, 3, 3];
    let index = 0;
    setReveal(0);

    const id = setInterval(() => {
      index = (index + 1) % phases.length;
      setReveal(phases[index]);
    }, 850);

    return () => clearInterval(id);
  }, [reduced, inView]);

  // Continuous scan; ATS score updates every time one full scan finishes
  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) {
      setScore(TARGET_ATS_SCORE);
      setScanDone(true);
      return undefined;
    }

    let cancelled = false;
    let raf = 0;

    setScore(0);
    setScanDone(false);

    const animateScore = () => {
      if (raf) cancelAnimationFrame(raf);
      const start = performance.now();
      setScanDone(true);
      const tick = (now) => {
        if (cancelled) return;
        const p = Math.min(1, (now - start) / SCORE_ANIM_MS);
        setScore(Math.round(TARGET_ATS_SCORE * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const onScanComplete = () => {
      if (cancelled) return;
      setScore(0);
      animateScore();
    };

    const id = setInterval(onScanComplete, SCAN_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, inView]);

  return (
    <section
      ref={sectionRef}
      id="templates"
      className="w-full bg-surface-container-low border-y border-outline-variant/20 py-xl overflow-hidden"
      style={{ color: TOKENS.ink }}
    >
      <style>{`
        @keyframes careerOsScanLine {
          0% { top: 0; opacity: 0; }
          6% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: calc(100% - 2px); opacity: 0; }
        }
        @keyframes careerOsScanTrail {
          0% { height: 0%; opacity: 0; }
          10% { opacity: 0.55; }
          85% { opacity: 0.35; }
          100% { height: 100%; opacity: 0; }
        }
        @keyframes careerOsBlockIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .career-os-fade-block { animation: careerOsBlockIn 0.5s ease-out both; }
        .career-os-scan-trail {
          position: absolute;
          inset-inline: 0;
          top: 0;
          height: 0;
          pointer-events: none;
          z-index: 10;
          background: linear-gradient(
            180deg,
            rgba(33, 112, 228, 0.08) 0%,
            rgba(33, 112, 228, 0.02) 100%
          );
          animation: careerOsScanTrail 2.6s cubic-bezier(0.45, 0, 0.2, 1) infinite;
        }
        .career-os-scan-line {
          position: absolute;
          inset-inline: 0;
          top: 0;
          height: 2px;
          pointer-events: none;
          z-index: 11;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(33, 112, 228, 0.15) 15%,
            #2170e4 50%,
            rgba(33, 112, 228, 0.15) 85%,
            transparent 100%
          );
          box-shadow: 0 0 10px 1px rgba(33, 112, 228, 0.45);
          animation: careerOsScanLine 2.6s cubic-bezier(0.45, 0, 0.2, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .career-os-fade-block,
          .career-os-scan-line,
          .career-os-scan-trail { animation: none !important; }
        }
      `}</style>

      <div className="page-container grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-10 items-center">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase mb-8"
            style={{
              background: 'rgba(20,33,61,0.06)',
              color: TOKENS.ink,
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              letterSpacing: '0.06em',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: TOKENS.signal }}
            />
            {t('solution.badge')}
          </div>

          <h2
            className="text-4xl md:text-5xl leading-[1.05] mb-6"
            style={{
              fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
              fontWeight: 600,
              color: TOKENS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {t('solution.titleLine1')}
            <br />
            {t('solution.titleLine2')}
          </h2>

          <p
            className="text-lg mb-12 max-w-md"
            style={{ color: TOKENS.inkSoft, lineHeight: 1.6 }}
          >
            {t('solution.description')}
          </p>

          <div className="relative pl-2">
            {(Array.isArray(steps) ? steps : []).map((step, i) => {
              const done = reveal > i;
              const isLast = i === steps.length - 1;
              return (
                <div key={step.title || i} className="relative flex gap-4 pb-9 last:pb-0">
                  {!isLast && (
                    <div
                      className="absolute left-[10px] top-6 bottom-0 w-px"
                      style={{
                        background: done ? TOKENS.signal : TOKENS.line,
                        transition: 'background 0.5s ease',
                      }}
                    />
                  )}
                  <div className="relative z-10 shrink-0 mt-0.5">
                    {done ? (
                      <CheckCircle2
                        size={21}
                        style={{ color: TOKENS.signal }}
                        strokeWidth={2.25}
                      />
                    ) : (
                      <Circle
                        size={21}
                        style={{ color: TOKENS.line }}
                        strokeWidth={2.25}
                      />
                    )}
                  </div>
                  <div>
                    <div
                      className="text-base font-semibold mb-1"
                      style={{
                        color: done ? TOKENS.ink : TOKENS.inkSoft,
                        transition: 'color 0.4s ease',
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: TOKENS.inkSoft, lineHeight: 1.55 }}
                    >
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            to="/resume/upload"
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: TOKENS.ink, color: TOKENS.paper }}
          >
            {t('solution.cta')}
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="relative flex justify-center md:-translate-x-4 lg:-translate-x-8">
          <div className="relative w-full max-w-md">
            <div
              className="absolute -top-4 -right-4 z-20 flex flex-col items-center justify-center rounded-full"
              style={{
                width: 68,
                height: 68,
                background: TOKENS.ink,
                border: `3px solid ${SECTION_BG}`,
                boxShadow: '0 8px 20px rgba(20,33,61,0.28)',
              }}
            >
              <span
                className="text-lg font-bold leading-none"
                style={{ color: TOKENS.paper }}
              >
                {score}
              </span>
              <span
                className="text-[8px] uppercase tracking-wide mt-0.5"
                style={{
                  color: scanDone ? TOKENS.highlight : 'rgba(250,248,243,0.5)',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                ATS
              </span>
            </div>

            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: TOKENS.card,
                boxShadow:
                  '0 1px 2px rgba(20,33,61,0.06), 0 28px 56px -14px rgba(20,33,61,0.22)',
                border: `1px solid ${TOKENS.line}`,
              }}
            >
              <img
                src={IMAGES.careerOsResume}
                alt={t('solution.mockupAriaLabel')}
                className="block w-full h-auto"
                loading="lazy"
              />

              {!reduced && inView && (
                <>
                  <div className="career-os-scan-trail" aria-hidden />
                  <div className="career-os-scan-line" aria-hidden />
                </>
              )}
            </div>

            {scanDone && !reduced && (
              <div
                className="career-os-fade-block absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
                style={{
                  background: TOKENS.card,
                  border: `1px solid ${TOKENS.line}`,
                  color: TOKENS.signal,
                  boxShadow: '0 4px 12px rgba(20,33,61,0.1)',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                }}
              >
                <ScanLine size={12} />
                {t('solution.optimizedBadge')}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
